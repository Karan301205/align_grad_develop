const env = require('../../config/env');
const { getApplicationStage } = require('../recruiters/hiringProgress.service');

// Job lifecycle, in one place.
//
// 1. Live:     from posting until expiresAt = createdAt + activeDays (the recruiter picks 1 to
//              JOB_MAX_ACTIVE_DAYS days). Expired jobs disappear from browsing and can't be applied
//              to at once; nothing is deleted at that moment.
// 2. Slimmed:  JOB_ARCHIVE_AFTER_DAYS after expiry, the long details (description, responsibilities,
//              requirements, screening questions) are removed. Title, company, dates and pay stay,
//              so applications still read sensibly.
// 3. Deleted:  JOB_DELETE_AFTER_DAYS after that, applications of people who weren't hired are
//              deleted, and the job too, unless someone was hired from it: then the slim job and
//              the hired applications are kept (retainedAt).
//
// Stages 2 and 3 run in a timer (startJobRetention), never on a user's request. Every step is
// safe to repeat, so it doesn't matter if several server processes run it.

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_ACTIVE_DAYS = 30; // same as the Job.activeDays column default
const RUN_EVERY_MS = 60 * 60 * 1000; // hourly; each run is cheap (indexed on expiresAt)
const DELETE_BATCH = 200; // jobs deleted per run, so one run stays short

/** When a job posted at `createdAt` and kept live for `activeDays` stops being live. */
function expiryFrom(createdAt, activeDays) {
  const days = Number.isInteger(activeDays) && activeDays > 0 ? activeDays : DEFAULT_ACTIVE_DAYS;
  return new Date(new Date(createdAt || Date.now()).getTime() + days * DAY_MS);
}

/** The job's stored expiry, or the one worked out from createdAt + activeDays for rows without it. */
function jobExpiry(job) {
  return job.expiresAt ? new Date(job.expiresAt) : expiryFrom(job.createdAt, job.activeDays);
}

const isJobExpired = (job, now = new Date()) => jobExpiry(job).getTime() < new Date(now).getTime();

/** Visible to candidates and open to applications: not paused, not closed and not expired. */
function isJobOpen(job, now = new Date()) {
  return Boolean(job) && job.status !== 'PAUSED' && job.status !== 'CLOSED' && !job.isPaused && !isJobExpired(job, now);
}

/**
 * One retention pass. Returns how many jobs were slimmed, deleted and kept for their hires.
 * `now` and the day counts can be passed in tests.
 */
async function runJobRetention(prisma, {
  now = new Date(),
  archiveAfterDays = env.JOB_ARCHIVE_AFTER_DAYS,
  deleteAfterDays = env.JOB_DELETE_AFTER_DAYS
} = {}) {
  const archiveCutoff = new Date(now.getTime() - archiveAfterDays * DAY_MS);
  const deleteCutoff = new Date(now.getTime() - (archiveAfterDays + deleteAfterDays) * DAY_MS);

  const slimmed = await prisma.job.updateMany({
    where: { expiresAt: { lt: archiveCutoff }, archivedAt: null },
    data: { description: '', roleResponsibilities: null, requirements: [], screeningQuestions: [], archivedAt: now }
  });

  const due = await prisma.job.findMany({
    where: { expiresAt: { lt: deleteCutoff }, retainedAt: null },
    select: { id: true },
    orderBy: { expiresAt: 'asc' },
    take: DELETE_BATCH
  });

  let deleted = 0;
  let retained = 0;
  for (const { id } of due) {
    try {
      const applications = await prisma.application.findMany({
        where: { jobId: id },
        select: { id: true, status: true, roundStatuses: true }
      });
      const notHired = applications.filter((app) => getApplicationStage(app) !== 'HIRED').map((app) => app.id);
      const keep = applications.length > notHired.length;
      await prisma.$transaction([
        ...(notHired.length ? [prisma.application.deleteMany({ where: { id: { in: notHired } } })] : []),
        keep ? prisma.job.update({ where: { id }, data: { retainedAt: now } }) : prisma.job.delete({ where: { id } })
      ]);
      if (keep) retained += 1;
      else deleted += 1;
    } catch (err) {
      // e.g. another server process handled this job a moment earlier; the next run retries.
      console.error(`[jobs] retention skipped job ${id}:`, err.message);
    }
  }

  return { slimmed: slimmed.count, deleted, retained };
}

/**
 * Runs the retention pass a minute after start-up and then hourly. Never on a user's request.
 * With several server processes and REDIS_URL set, only one of them runs each hour
 * (infrastructure/redis runOncePer); without Redis every process runs it (safe to repeat).
 * Returns a function that stops the timers (used on shutdown).
 */
function startJobRetention(prisma, { runOncePer = require('../../infrastructure/redis').runOncePer } = {}) {
  const run = async () => {
    try {
      // Hold the turn a minute less than the interval, so the next hour is free again.
      if (!(await runOncePer('job-retention', RUN_EVERY_MS - 60 * 1000))) return;
      const result = await runJobRetention(prisma);
      if (result.slimmed || result.deleted || result.retained) {
        console.log(`[jobs] retention: ${result.slimmed} slimmed, ${result.deleted} deleted, ${result.retained} kept for their hires`);
      }
    } catch (err) {
      console.error('[jobs] retention run failed:', err.message);
    }
  };
  const first = setTimeout(run, 60 * 1000).unref();
  const hourly = setInterval(run, RUN_EVERY_MS).unref();
  return () => {
    clearTimeout(first);
    clearInterval(hourly);
  };
}

module.exports = { expiryFrom, jobExpiry, isJobExpired, isJobOpen, runJobRetention, startJobRetention };
