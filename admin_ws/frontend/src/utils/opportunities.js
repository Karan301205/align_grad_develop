// Turns the /dashboard/opportunities answer into what the dashboard charts need. No React.
import { hasAny, percentOf, weekLabel, weekRangeLabel } from './chart.js';

/* ---- what is listed ---- */

/** Slices for the "what is listed" donut. "Other" only appears when something unusual exists. */
export function listedSlices(listings = {}) {
  const slices = [
    { key: 'jobs', label: 'Jobs', value: listings.jobs || 0, tone: 'jobs' },
    { key: 'internships', label: 'Internships', value: listings.internships || 0, tone: 'internships' },
    { key: 'gigs', label: 'Gigs', value: listings.gigs || 0, tone: 'gigs' }
  ];
  if (listings.other > 0) slices.push({ key: 'other', label: 'Other', value: listings.other, tone: 'other' });
  return slices;
}

export const listedTotal = (listings = {}) => listedSlices(listings).reduce((sum, slice) => sum + slice.value, 0);

/* ---- weekly series ---- */

export const weeklyLabels = (weekly = []) => weekly.map((week) => weekLabel(week.weekStart));
export const weeklyRanges = (weekly = []) => weekly.map((week) => weekRangeLabel(week.weekStart));

/** New postings per week, stacked: jobs, internships, gigs. */
export const postingSeries = (weekly = []) => [
  { key: 'jobs', name: 'Jobs', tone: 'jobs', values: weekly.map((w) => w.jobs) },
  { key: 'internships', name: 'Internships', tone: 'internships', values: weekly.map((w) => w.internships) },
  { key: 'gigs', name: 'Gigs', tone: 'gigs', values: weekly.map((w) => w.gigs) }
];

/** Responses per week: applications to jobs and internships, and pitches on gigs. */
export const responseSeries = (weekly = []) => [
  { key: 'applications', name: 'Job and internship applications', tone: 'applications', values: weekly.map((w) => w.applications) },
  { key: 'pitches', name: 'Gig pitches', tone: 'pitches', values: weekly.map((w) => w.pitches) }
];

export const seriesHaveData = (series) => series.some((s) => hasAny(s.values));

/* ---- gigs ---- */

const GIG_STATUS = {
  OPEN: { label: 'Open', tone: 'ok' },
  IN_PROGRESS: { label: 'In progress', tone: 'info' },
  COMPLETED: { label: 'Completed', tone: 'accent' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
  PAUSED: { label: 'Paused', tone: 'warn' }
};
const ALWAYS_SHOWN = ['OPEN', 'IN_PROGRESS', 'COMPLETED'];

const humanize = (status) => {
  const text = String(status).toLowerCase().replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Unknown';
};

/** The gig pipeline in a fixed order. Open, in progress and completed always show; others only when used. */
export function gigStatusRows(byStatus = []) {
  const counts = new Map(byStatus.map((row) => [row.status, row.count]));
  const known = Object.keys(GIG_STATUS).filter((status) => ALWAYS_SHOWN.includes(status) || counts.get(status) > 0);
  const unknown = byStatus.filter((row) => !GIG_STATUS[row.status] && row.count > 0).map((row) => row.status);
  return [...known, ...unknown].map((status) => ({
    status,
    label: GIG_STATUS[status]?.label || humanize(status),
    tone: GIG_STATUS[status]?.tone || 'neutral',
    count: counts.get(status) || 0
  }));
}

/**
 * Rows for a "share of" bar list: adds each row's percentage and a bar scaled to the biggest row.
 * Pass `total` when the rows are only part of the whole (e.g. the top 6 categories of all gigs),
 * so a share is out of everything, not out of the rows shown.
 */
export function shareRows(rows, total = rows.reduce((sum, row) => sum + row.count, 0)) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return rows.map((row) => ({ ...row, percent: percentOf(row.count, total), bar: (row.count / max) * 100 }));
}

/** "₹1,25,000", or "₹5,000 · $7,000" when open gigs use several currencies. "" when none are open. */
export function formatBudgets(openBudget = []) {
  return openBudget
    .filter((entry) => entry.total > 0)
    .map((entry) => {
      try {
        return new Intl.NumberFormat(entry.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: entry.currency, maximumFractionDigits: 0 }).format(entry.total);
      } catch {
        return `${entry.currency} ${Math.round(entry.total).toLocaleString()}`;
      }
    })
    .join(' · ');
}

/* ---- most popular ---- */

export const POPULAR_KIND = {
  JOB: { label: 'Job', tone: 'accent', unit: ['applicant', 'applicants'] },
  INTERNSHIP: { label: 'Internship', tone: 'ok', unit: ['applicant', 'applicants'] },
  GIG: { label: 'Gig', tone: 'warn', unit: ['pitch', 'pitches'] }
};

export function popularKind(type) {
  return POPULAR_KIND[type] || POPULAR_KIND.JOB;
}

/* ---- freshness ---- */

/** "just now", "12 s ago", "3 min ago", "2 h ago"; "" for a missing or invalid time. */
export function describeAge(iso, now = Date.now()) {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  return `${Math.floor(seconds / 3600)} h ago`;
}
