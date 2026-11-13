// Pure helpers for the recruiter Home dashboard. Everything is derived from the
// layout's data: jobs (GET /recruiter/jobs, with applications), candidates and
// top talents (GET /recruiter/candidates, /recruiter/top-talents).
import { calculateHiringProgressSnapshot, getApplicationStage } from '../../../utils/hiringProgress';

const DAY_MS = 24 * 60 * 60 * 1000;
export const CLOSING_SOON_DAYS = 5;
const NEW_APPLICANT_DAYS = 7;

export const isPaused = (job) => job.status === 'PAUSED' || Boolean(job.isPaused);

/** Days until the listing is removed (createdAt + activeDays, the server's rule). */
export function daysLeft(job, now = Date.now()) {
  const expiry = new Date(job.createdAt).getTime() + (job.activeDays || 30) * DAY_MS;
  return Math.max(0, Math.ceil((expiry - now) / DAY_MS));
}

export const closingDate = (job) =>
  new Date(new Date(job.createdAt).getTime() + (job.activeDays || 30) * DAY_MS).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Job and internship posts (gigs live in the Gigs marketplace). */
export const jobPosts = (jobs) => (Array.isArray(jobs) ? jobs : []).filter((job) => job.opportunityType !== 'GIG');

/** Posts candidates can see right now: not paused or closed, and not past their listing period. */
export const liveJobs = (jobs, now = Date.now()) => jobPosts(jobs).filter((job) => !isPaused(job) && job.status !== 'CLOSED' && daysLeft(job, now) > 0);

const isRecent = (app, now) => app.createdAt && now - new Date(app.createdAt).getTime() <= NEW_APPLICANT_DAYS * DAY_MS;

/** Numbers for the metric cards (same stage rules as the Jobs page used). */
export function dashboardMetrics(jobs, now = Date.now()) {
  const posts = jobPosts(jobs);
  const live = liveJobs(jobs, now);
  const snapshot = calculateHiringProgressSnapshot(posts);
  const applications = posts.flatMap((job) => job.applications || []);
  const openings = live.reduce((sum, job) => sum + (Number(job.openings) || 0), 0);
  return {
    liveRoles: live.length,
    pausedRoles: posts.filter(isPaused).length,
    applicants: snapshot.totalApplicants,
    newApplicants: applications.filter((app) => isRecent(app, now)).length,
    shortlisted: snapshot.shortlisted,
    interviews: snapshot.interviews,
    hires: snapshot.hires,
    openings
  };
}

/** Applied / shortlisted / interview / hired for one job. */
export function jobCounts(job, now = Date.now()) {
  const snapshot = calculateHiringProgressSnapshot([job]);
  return {
    applied: snapshot.totalApplicants,
    shortlisted: snapshot.shortlisted,
    interviews: snapshot.interviews,
    hires: snapshot.hires,
    newApplicants: (job.applications || []).filter((app) => isRecent(app, now)).length
  };
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * "Needs your attention", built only from things the portal tracks:
 * applicants nobody has moved yet, live jobs about to close, no job credits, no live jobs.
 */
export function attentionItems({ jobs, quota, now = Date.now() }) {
  const items = [];
  const live = liveJobs(jobs, now);

  const waiting = live
    .map((job) => ({ job, count: (job.applications || []).filter((app) => getApplicationStage(app) === 'APPLIED').length }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
  const totalWaiting = waiting.reduce((sum, entry) => sum + entry.count, 0);
  if (totalWaiting > 0) {
    items.push({
      id: 'review',
      tone: 'blue',
      icon: 'review',
      title: `${plural(totalWaiting, 'applicant')} waiting for review`,
      detail: waiting.slice(0, 3).map((entry) => `${entry.job.title} (${entry.count})`).join(' · '),
      action: 'review',
      job: waiting.length === 1 ? waiting[0].job : null
    });
  }

  live
    .filter((job) => daysLeft(job, now) <= CLOSING_SOON_DAYS)
    .sort((a, b) => daysLeft(a, now) - daysLeft(b, now))
    .forEach((job) => {
      const counts = jobCounts(job, now);
      const days = daysLeft(job, now);
      items.push({
        id: `closing-${job.id}`,
        tone: 'orange',
        icon: 'clock',
        title: `${job.title} closes in ${plural(days, 'day')}`,
        detail: `${plural(counts.applied, 'applicant')}, ${counts.shortlisted} shortlisted, ${counts.hires ? `${counts.hires} hired` : 'no hires yet'}. Edit the job to keep it open longer.`,
        action: 'jobs'
      });
    });

  if (quota && quota.remainingJobs <= 0) {
    items.push({ id: 'credits', tone: 'orange', icon: 'card', title: 'No job credits left', detail: 'Buy a credit pack to publish your next job.', action: 'billing' });
  }

  if (live.length === 0) {
    items.push({ id: 'post', tone: 'blue', icon: 'post', title: 'You have no live jobs', detail: 'Post a job to start receiving applicants who meet your skill bars.', action: 'post' });
  }
  return items;
}

/** "Good morning" / "Good afternoon" / "Good evening" by the viewer's clock. */
export function greeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}
