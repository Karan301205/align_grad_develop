// What the admin can tell about a candidate from the profile the API returns.
import { matchesQuery } from './collections.js';

export const skillsOf = (candidate) => (Array.isArray(candidate?.skills) ? candidate.skills : []);

/** Skills that passed a server-scored test (verifiedRating above zero). */
export const verifiedSkillCount = (candidate) => skillsOf(candidate).filter((skill) => skill.verifiedRating > 0).length;

export const hasSkills = (candidate) => skillsOf(candidate).length > 0;
export const hasVideo = (candidate) => Boolean(candidate?.introVideoUrl);

const timeOf = (iso) => {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? null : time;
};

/** { jobs, internships, gigs, total } from the API, or null when the candidate came without counts. */
export function applicationsOf(candidate) {
  const a = candidate?.applications;
  if (!a || typeof a !== 'object') return null;
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return { jobs: n(a.jobs), internships: n(a.internships), gigs: n(a.gigs), total: n(a.total) };
}

/** Newest joined first: what the list shows until you pick another order. */
export const DEFAULT_SORT = { key: 'joined', dir: 'desc' };
export const DEFAULT_FILTERS = { skills: 'all', verified: 'all', video: 'all', applied: 'all', joined: 'all' };

/**
 * Quick filters above the table. Each one is a preset of the column filters (`preset`), so the tabs and the
 * column menus are one state and can't disagree. `test` is what the tab's count chip counts.
 */
export const CANDIDATE_TABS = [
  { key: 'all', label: 'All', test: () => true, preset: {} },
  { key: 'skills', label: 'Skills added', test: hasSkills, preset: { skills: 'has' } },
  { key: 'noSkills', label: 'No skills yet', test: (c) => !hasSkills(c), preset: { skills: 'none' } },
  { key: 'verified', label: 'Verified skills', test: (c) => verifiedSkillCount(c) > 0, preset: { verified: 'has' } },
  { key: 'noVideo', label: 'No video résumé', test: (c) => !hasVideo(c), preset: { video: 'none' } }
];

/** The column filters a tab stands for. */
export const filtersForTab = (key) => ({ ...DEFAULT_FILTERS, ...(CANDIDATE_TABS.find((t) => t.key === key) || CANDIDATE_TABS[0]).preset });

/** Which tab the current filters are exactly equal to, or null when they are a custom mix. */
export function activeTabKey(filters) {
  const current = JSON.stringify({ ...DEFAULT_FILTERS, ...filters });
  const tab = CANDIDATE_TABS.find((t) => JSON.stringify(filtersForTab(t.key)) === current);
  return tab ? tab.key : null;
}

const DAY = 24 * 60 * 60 * 1000;

function appliedMatches(candidate, kind) {
  const a = applicationsOf(candidate) || { jobs: 0, internships: 0, gigs: 0, total: 0 };
  if (kind === 'any') return a.total > 0;
  if (kind === 'none') return a.total === 0;
  return a[kind] > 0; // 'jobs' | 'internships' | 'gigs'
}

function joinedMatches(candidate, range, now) {
  const time = timeOf(candidate.createdAt);
  if (time === null) return false; // can't tell when they joined
  if (range === '7d') return now - time <= 7 * DAY;
  if (range === '30d') return now - time <= 30 * DAY;
  if (range === 'older') return now - time > 30 * DAY;
  return true;
}

/** The column filters and the search box together. `now` is only there so tests can fix the clock. */
export function filterCandidates(candidates, { filters = DEFAULT_FILTERS, query = '', now = Date.now() } = {}) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return candidates.filter((c) => {
    if (f.skills === 'has' && !hasSkills(c)) return false;
    if (f.skills === 'none' && hasSkills(c)) return false;
    if (f.verified === 'has' && verifiedSkillCount(c) === 0) return false;
    if (f.verified === 'none' && verifiedSkillCount(c) > 0) return false;
    if (f.video === 'yes' && !hasVideo(c)) return false;
    if (f.video === 'none' && hasVideo(c)) return false;
    if (f.applied !== 'all' && !appliedMatches(c, f.applied)) return false;
    if (f.joined !== 'all' && !joinedMatches(c, f.joined, now)) return false;
    return matchesQuery([c.name, c.email, c.username, c.nationality, ...skillsOf(c).map((s) => s.name)], query);
  });
}

// A candidate with no join date counts as the oldest. Ties go by id, which starts with the creation time
// in hex, so the order is total and stable.
const idOrder = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
function compareAge(a, b) {
  const ta = timeOf(a.createdAt) ?? -Infinity;
  const tb = timeOf(b.createdAt) ?? -Infinity;
  return ta !== tb ? (ta < tb ? -1 : 1) : idOrder(a, b);
}
const newestFirst = (a, b) => compareAge(b, a);

// `get` returns the value to sort by; null means "nothing to sort by" and sorts last in either direction.
const COLUMNS = {
  joined: { get: (c) => timeOf(c.createdAt) },
  name: { get: (c) => String(c.name || '').toLowerCase(), text: true },
  skills: { get: (c) => skillsOf(c).length },
  verified: { get: verifiedSkillCount },
  video: { get: (c) => (hasVideo(c) ? 1 : 0) },
  applications: { get: (c) => applicationsOf(c)?.total ?? 0 }
};

/** A sorted copy. Ties and blanks fall back to newest first, so the order is always stable. */
export function sortCandidates(candidates, sort = DEFAULT_SORT) {
  const { get, text } = COLUMNS[sort.key] || COLUMNS.joined;
  const direction = sort.dir === 'asc' ? 1 : -1;
  const blank = (c) => get(c) === null || get(c) === undefined;
  const compare = (a, b) => {
    const base = text ? get(a).localeCompare(get(b)) : get(a) - get(b);
    return base * direction || newestFirst(a, b);
  };
  return [...candidates.filter((c) => !blank(c))].sort(compare).concat([...candidates.filter(blank)].sort(newestFirst));
}

const SORT_LABELS = {
  'joined:desc': 'newest joined first',
  'joined:asc': 'oldest joined first',
  'name:asc': 'candidate A → Z',
  'name:desc': 'candidate Z → A',
  'skills:desc': 'most skills first',
  'skills:asc': 'fewest skills first',
  'verified:desc': 'most verified skills first',
  'verified:asc': 'fewest verified skills first',
  'video:desc': 'video résumé first',
  'video:asc': 'no video résumé first',
  'applications:desc': 'most applications first',
  'applications:asc': 'fewest applications first'
};

/** "newest joined first": the order, in words, for the line above the table. */
export const describeSort = (sort) => SORT_LABELS[`${sort.key}:${sort.dir}`] || SORT_LABELS['joined:desc'];

/** True when the list is in its default order with no column filter. */
export const isDefaultView = ({ sort, filters }) =>
  sort.key === DEFAULT_SORT.key && sort.dir === DEFAULT_SORT.dir && JSON.stringify({ ...DEFAULT_FILTERS, ...filters }) === JSON.stringify(DEFAULT_FILTERS);

/**
 * "2022-08 – 2026-05", "2024-01 – Present", "Since 2024-01", "Until 2026-05" or ''.
 * A missing end date is not assumed to mean "present" (the old screen did that).
 */
export function periodLabel({ startDate, endDate, currentlyWorking } = {}) {
  const start = String(startDate || '').trim();
  const end = String(endDate || '').trim();
  if (currentlyWorking) return start ? `${start} – Present` : 'Present';
  if (start && end) return `${start} – ${end}`;
  if (start) return `Since ${start}`;
  if (end) return `Until ${end}`;
  return '';
}

/** "CGPA 8.1" for an education entry, or '' when either part is missing. */
export function gradeLabel({ gradeType, gradeValue } = {}) {
  const type = String(gradeType || '').trim();
  const value = String(gradeValue || '').trim();
  return type && value ? `${type} ${value}` : '';
}

/** The skill's own rating, with the test-verified rating when there is one. */
export function skillRatings(skill) {
  const self = Number(skill?.rating);
  const verified = Number(skill?.verifiedRating);
  return {
    self: Number.isFinite(self) && self > 0 ? self : null,
    verified: Number.isFinite(verified) && verified > 0 ? verified : null
  };
}
