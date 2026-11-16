// Job postings as the admin API returns them: skill requirements, and sorting / filtering for the list.
// Pure functions, tested in jobs.test.js.
import { matchesQuery } from './collections.js';

/**
 * A skill bar on a job: { name, minRating }. Jobs store `{ skillName, minRating }`;
 * the legacy `{ skill, rating }` spelling is read too. A missing rating stays null
 * (the old screen invented a default of 5).
 */
export function normalizeRequirement(requirement) {
  const rating = Number(requirement?.minRating ?? requirement?.rating);
  return {
    name: String(requirement?.skillName ?? requirement?.skill ?? '').trim(),
    minRating: Number.isFinite(rating) && rating > 0 ? rating : null
  };
}

export const requirementsOf = (job) =>
  (Array.isArray(job?.requirements) ? job.requirements : []).map(normalizeRequirement).filter((r) => r.name);

const timeOf = (iso) => {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? null : time;
};

// What the API writes when a posting leaves a field blank.
const NOT_SPECIFIED = 'Not specified';

const isInternship = (job) => /internship/i.test(job?.jobType || '');
const isJob = (job) => /\bjob\b/i.test(job?.jobType || '');
const isFullTime = (job) => /^full-time/i.test(job?.jobType || '');
const isPartTime = (job) => /^part-time/i.test(job?.jobType || '');
const hasPay = (job) => Boolean(job?.salaryRange) && job.salaryRange !== NOT_SPECIFIED;

/**
 * The monthly amount in a pay such as "₹25,000/month" (the form the API writes for the digits a recruiter
 * types), or null for anything else: free text, "Not specified". Used only to sort by pay.
 */
export function payAmount(job) {
  const match = /^₹([\d,]+)\/month/.exec(String(job?.salaryRange || ''));
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : null;
}

/** Newest posted first: what the list shows until you pick another order. */
export const DEFAULT_SORT = { key: 'posted', dir: 'desc' };
export const DEFAULT_FILTERS = { type: 'all', pay: 'all', skills: 'all', posted: 'all' };

const TYPE_TESTS = { jobs: isJob, internships: isInternship, fulltime: isFullTime, parttime: isPartTime };

/**
 * Quick filters above the table. Each is a preset of the column filters (`preset`), so the tabs and the
 * column menus are one state and can't disagree. `test` is what the tab's count chip counts.
 * Gigs and "Not specified" postings only show under All.
 */
export const JOB_TABS = [
  { key: 'all', label: 'All', test: () => true, preset: {} },
  { key: 'jobs', label: 'Jobs', test: isJob, preset: { type: 'jobs' } },
  { key: 'internships', label: 'Internships', test: isInternship, preset: { type: 'internships' } }
];

/** The column filters a tab stands for. */
export const filtersForTab = (key) => ({ ...DEFAULT_FILTERS, ...(JOB_TABS.find((t) => t.key === key) || JOB_TABS[0]).preset });

/** Which tab the current filters are exactly equal to, or null when they are a custom mix. */
export function activeTabKey(filters) {
  const current = JSON.stringify({ ...DEFAULT_FILTERS, ...filters });
  const tab = JOB_TABS.find((t) => JSON.stringify(filtersForTab(t.key)) === current);
  return tab ? tab.key : null;
}

const DAY = 24 * 60 * 60 * 1000;

function postedMatches(job, range, now) {
  const time = timeOf(job.postedAt);
  if (time === null) return false; // can't tell when it was posted
  if (range === '7d') return now - time <= 7 * DAY;
  if (range === '30d') return now - time <= 30 * DAY;
  if (range === 'older') return now - time > 30 * DAY;
  return true;
}

/** The column filters and the search box together. `now` is only there so tests can fix the clock. */
export function filterJobs(jobs, { filters = DEFAULT_FILTERS, query = '', now = Date.now() } = {}) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return jobs.filter((job) => {
    if (f.type !== 'all' && !(TYPE_TESTS[f.type] || (() => true))(job)) return false;
    if (f.pay === 'listed' && !hasPay(job)) return false;
    if (f.pay === 'none' && hasPay(job)) return false;
    if (f.skills === 'has' && requirementsOf(job).length === 0) return false;
    if (f.skills === 'none' && requirementsOf(job).length > 0) return false;
    if (f.posted !== 'all' && !postedMatches(job, f.posted, now)) return false;
    return matchesQuery([job.title, job.companyName, job.location, job.jobType], query);
  });
}

// A posting with no date counts as the oldest. Ties go by id, which starts with the creation time in hex,
// so the order is total and stable.
const idOrder = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
function compareAge(a, b) {
  const ta = timeOf(a.postedAt) ?? -Infinity;
  const tb = timeOf(b.postedAt) ?? -Infinity;
  return ta !== tb ? (ta < tb ? -1 : 1) : idOrder(a, b);
}
const newestFirst = (a, b) => compareAge(b, a);

const lower = (value) => String(value || '').toLowerCase();

// `get` returns the value to sort by; null means "nothing to sort by" and sorts last in either direction.
const COLUMNS = {
  posted: { get: (j) => timeOf(j.postedAt) },
  title: { get: (j) => lower(j.title), text: true },
  company: { get: (j) => lower(j.companyName), text: true },
  type: { get: (j) => lower(j.jobType), text: true },
  pay: { get: payAmount },
  skills: { get: (j) => requirementsOf(j).length }
};

/** A sorted copy. Ties and blanks fall back to newest first, so the order is always stable. */
export function sortJobs(jobs, sort = DEFAULT_SORT) {
  const { get, text } = COLUMNS[sort.key] || COLUMNS.posted;
  const direction = sort.dir === 'asc' ? 1 : -1;
  const blank = (job) => get(job) === null || get(job) === undefined;
  const compare = (a, b) => {
    const base = text ? get(a).localeCompare(get(b)) : get(a) - get(b);
    return base * direction || newestFirst(a, b);
  };
  return [...jobs.filter((j) => !blank(j))].sort(compare).concat([...jobs.filter(blank)].sort(newestFirst));
}

const SORT_LABELS = {
  'posted:desc': 'newest posted first',
  'posted:asc': 'oldest posted first',
  'title:asc': 'title A → Z',
  'title:desc': 'title Z → A',
  'company:asc': 'company A → Z',
  'company:desc': 'company Z → A',
  'type:asc': 'type A → Z',
  'type:desc': 'type Z → A',
  'pay:desc': 'highest pay first',
  'pay:asc': 'lowest pay first',
  'skills:desc': 'most skills required first',
  'skills:asc': 'fewest skills required first'
};

/** "newest posted first": the order, in words, for the line above the table. */
export const describeSort = (sort) => SORT_LABELS[`${sort.key}:${sort.dir}`] || SORT_LABELS['posted:desc'];

/** True when the list is in its default order with no column filter. */
export const isDefaultView = ({ sort, filters }) =>
  sort.key === DEFAULT_SORT.key && sort.dir === DEFAULT_SORT.dir && JSON.stringify({ ...DEFAULT_FILTERS, ...filters }) === JSON.stringify(DEFAULT_FILTERS);
