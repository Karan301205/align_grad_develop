// Pure helpers for the Jobs list and the Applications view. Jobs come from
// GET /recruiter/jobs: each job carries `applications`, and each application its
// candidate's Profile row as `student`.
import { getApplicationStage } from '../../../utils/hiringProgress';
import { formatLongDate, formatShortDate } from '../../../utils/format';
import { effectiveScore, findSkill } from '../candidates/candidateData';
import { CLOSING_SOON_DAYS, closingDate, daysLeft, isPaused, jobCounts } from '../dashboard/dashboardData';

export { CLOSING_SOON_DAYS, closingDate, daysLeft, isPaused, jobCounts };

const plural = (count, word) => `${count} ${word}${Number(count) === 1 ? '' : 's'}`;
const lower = (value) => String(value || '').toLowerCase();

/* ----------------------------------------------------------------- jobs ---- */

/** Which tab a job sits in. Closed jobs only exist in older data (the portal can't close a job). */
export const jobTab = (job) => (job.status === 'CLOSED' ? 'closed' : isPaused(job) ? 'paused' : 'active');

/** "Full-time" / "Part-time", from the pay field the post filled (as the post-a-job wizard saves it). */
function hoursOf(job) {
  if (job.stipendFullTime) return 'Full-time';
  if (job.stipendPartTime) return 'Part-time';
  return '';
}

/** "Full-time job", "Part-time internship", "Internship", "Gig". */
export function typeLabel(job) {
  if (job.opportunityType === 'GIG') return 'Gig';
  const noun = job.opportunityType === 'INTERNSHIP' ? 'internship' : 'job';
  const hours = hoursOf(job);
  return hours ? `${hours} ${noun}` : noun.charAt(0).toUpperCase() + noun.slice(1);
}

/** Stored pay is digits from the wizard ("15000"); older posts may hold free text. */
function payLabel(job) {
  const raw = String(job.stipendFullTime || job.stipendPartTime || '').trim();
  if (!raw) return '';
  return /^\d+$/.test(raw) ? `₹${Number(raw).toLocaleString('en-IN')}/month` : raw;
}

function durationLabel(job) {
  const raw = String(job.duration || '').trim();
  if (job.opportunityType !== 'INTERNSHIP' || !raw) return '';
  return /^\d+$/.test(raw) ? plural(raw, 'month') : raw;
}

/** "Full-time job · Work from office · Hyderabad · 3 openings · Posted 1 Nov". */
export function jobMetaLine(job) {
  const openings = Number(job.openings) > 0 ? plural(job.openings, 'opening') : '';
  const posted = formatShortDate(job.createdAt);
  return [typeLabel(job), durationLabel(job), payLabel(job), job.workMode, job.location, openings, posted && `Posted ${posted}`]
    .filter(Boolean)
    .join(' · ');
}

/** "SQL ≥ 7" for each skill bar. */
export const barLabels = (job) => (Array.isArray(job.requirements) ? job.requirements : []).map((req) => `${req.skillName} ≥ ${req.minRating}`);

/**
 * The closing line under a job: `tone` is 'warn' for the last few days.
 * Jobs are removed by the server once createdAt + activeDays passes, paused or not.
 */
export function closingInfo(job, now = Date.now()) {
  const left = daysLeft(job, now);
  const date = closingDate(job);
  if (jobTab(job) === 'closed') return { tone: 'calm', text: 'Closed' };
  if (left === 0) return { tone: 'warn', text: 'Listing period over · removed at the next refresh' };
  if (isPaused(job)) return { tone: 'calm', text: `Hidden from candidates while paused · listing ends ${date}` };
  if (left <= CLOSING_SOON_DAYS) return { tone: 'warn', text: `Closes ${date} · ${plural(left, 'day')} left` };
  return { tone: 'calm', text: `Closes ${date}` };
}

const expiryTime = (job) => new Date(job.createdAt).getTime() + (job.activeDays || 30) * 24 * 60 * 60 * 1000;

export const JOB_SORTS = [
  ['closing', 'Closing soonest'],
  ['new', 'Most new applicants'],
  ['newest', 'Newest first']
];

export function sortJobs(jobs, sort, now = Date.now()) {
  const newest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
  const list = [...jobs];
  if (sort === 'closing') return list.sort((a, b) => expiryTime(a) - expiryTime(b) || newest(a, b));
  if (sort === 'new') {
    return list.sort((a, b) => jobCounts(b, now).newApplicants - jobCounts(a, now).newApplicants || (b.applications?.length || 0) - (a.applications?.length || 0) || newest(a, b));
  }
  return list.sort(newest);
}

/** Title, type, place, work mode and skill names. */
export function jobMatchesQuery(job, query) {
  const q = lower(query).trim();
  if (!q) return true;
  const skills = (job.requirements || []).map((req) => req.skillName).join(' ');
  return [job.title, typeLabel(job), job.location, job.workMode, skills].some((field) => lower(field).includes(q));
}

/** Public job page that candidates can open (same link the old Share button copied). */
export const jobLink = (job) => `${window.location.origin}/job_brief?id=${job.id}`;

/** Copies text; resolves false when the browser refuses. */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall back below
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

/* --------------------------------------------------------- applications ---- */

/**
 * How far a candidate reaches the job's skill bars, 0–100: the average of
 * min(1, score / bar) over the bars, with the score that counts on the server
 * (test-verified level first). `null` when the job has no bars.
 */
export function matchScore(job, student) {
  const bars = Array.isArray(job?.requirements) ? job.requirements.filter((req) => req && req.skillName && req.minRating > 0) : [];
  if (!student || bars.length === 0) return null;
  const total = bars.reduce((sum, req) => sum + Math.min(1, effectiveScore(findSkill(student, req.skillName)) / req.minRating), 0);
  return Math.round((total / bars.length) * 100);
}

/** Colour band for a match score: 80+, 60–79, 40–59, below 40. */
export function matchBand(score) {
  if (score == null) return 'none';
  if (score >= 80) return 'high';
  if (score >= 60) return 'mid';
  if (score >= 40) return 'low';
  return 'poor';
}

export const STAGES = [
  ['APPLIED', 'Applied'],
  ['SHORTLISTED', 'Shortlisted'],
  ['INTERVIEW', 'Interview'],
  ['HIRED', 'Hired'],
  ['REJECTED', 'Rejected']
];
export const stageLabel = (stage) => (STAGES.find(([id]) => id === stage) || STAGES[0])[1];

/** Where the candidate wants to work, else their nationality. */
export function locationOf(student) {
  const preferred = (student?.preferredLocations || []).filter(Boolean);
  if (preferred.length) return preferred.join(', ');
  if (student?.openToAnyLocation) return 'Open to any location';
  return student?.nationality || '';
}

export const emailOf = (row) => row.student?.email || row.app.email || '';

/** One row per application, for one job or (jobId 'ALL') every job. */
export function applicationRows(jobs, jobId) {
  const list = Array.isArray(jobs) ? jobs : [];
  const source = jobId === 'ALL' ? list : list.filter((job) => job.id === jobId);
  return source.flatMap((job) =>
    (job.applications || []).map((app) => ({
      app,
      job,
      student: app.student || null,
      stage: getApplicationStage(app),
      score: matchScore(job, app.student)
    }))
  );
}

export function stageCounts(rows) {
  const counts = { ALL: rows.length, APPLIED: 0, SHORTLISTED: 0, INTERVIEW: 0, HIRED: 0, REJECTED: 0 };
  rows.forEach((row) => {
    counts[row.stage] += 1;
  });
  return counts;
}

/** Average of the rows that have a score; null when none do. */
export function averageMatch(rows) {
  const scored = rows.filter((row) => row.score != null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((sum, row) => sum + row.score, 0) / scored.length);
}

export const MATCH_FILTERS = [
  ['ALL', 'All match %'],
  ['80', '80% and above'],
  ['70', '70% and above'],
  ['50', '50% and above'],
  ['BELOW_50', 'Below 50%']
];

export const PAGE_SIZES = [10, 25, 50];

export const APPLICATION_SORTS = [
  ['DATE_DESC', 'Applied: newest first'],
  ['DATE_ASC', 'Applied: oldest first'],
  ['MATCH_DESC', 'Match: highest first'],
  ['MATCH_ASC', 'Match: lowest first'],
  ['NAME_ASC', 'Name: A to Z'],
  ['NAME_DESC', 'Name: Z to A']
];

function matchesMatchFilter(score, filter) {
  if (filter === 'ALL') return true;
  if (score == null) return false;
  if (filter === 'BELOW_50') return score < 50;
  return score >= Number(filter);
}

/** Search covers name, username, title, email, phone, skills and the job title. */
export function filterRows(rows, { query, stage, match }) {
  const q = lower(query).trim();
  return rows.filter((row) => {
    if (stage !== 'ALL' && row.stage !== stage) return false;
    if (!matchesMatchFilter(row.score, match)) return false;
    if (!q) return true;
    const s = row.student || {};
    const skills = (s.skills || []).map((skill) => (typeof skill === 'string' ? skill : skill?.name)).join(' ');
    return [s.name, s.username, s.title, emailOf(row), s.phone, skills, row.job.title].some((field) => lower(field).includes(q));
  });
}

export function sortRows(rows, sortBy) {
  const time = (row) => new Date(row.app.createdAt || 0).getTime();
  const name = (row) => lower(row.student?.name);
  // Rows without a score (job without bars) go last either way.
  const score = (row, fallback) => (row.score == null ? fallback : row.score);
  const compare = {
    DATE_DESC: (a, b) => time(b) - time(a),
    DATE_ASC: (a, b) => time(a) - time(b),
    MATCH_DESC: (a, b) => score(b, -1) - score(a, -1) || time(b) - time(a),
    MATCH_ASC: (a, b) => score(a, 101) - score(b, 101) || time(b) - time(a),
    NAME_ASC: (a, b) => name(a).localeCompare(name(b)),
    NAME_DESC: (a, b) => name(b).localeCompare(name(a))
  }[sortBy];
  return compare ? [...rows].sort(compare) : rows;
}

/* ------------------------------------------------------------------ csv ---- */

// Quotes every cell, and stops spreadsheet apps from running a cell as a formula
// ("=…", "@…", or "+"/"-" not followed by a digit, so phone numbers stay as they are).
function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=@\t\r]/.test(text) || /^[+-](?![\d\s(])/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function applicationsCsv(rows) {
  const header = ['Candidate name', 'Username', 'Title', 'Job', 'Match %', 'Applied on', 'Stage', 'Status', 'Email', 'Phone', 'Location'];
  const lines = rows.map((row) => {
    const s = row.student || {};
    return [
      s.name,
      s.username,
      s.title,
      row.job.title,
      row.score == null ? '' : `${row.score}%`,
      formatLongDate(row.app.createdAt),
      stageLabel(row.stage),
      row.app.status || 'APPLIED',
      emailOf(row),
      s.phone,
      locationOf(s)
    ].map(csvCell);
  });
  // BOM so Excel opens the file as UTF-8 (₹, accented names).
  return `\uFEFF${[header.map(csvCell), ...lines].map((cells) => cells.join(',')).join('\r\n')}`;
}

export function downloadText(text, fileName, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const safeFileName = (value) => String(value || '').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'Job';
