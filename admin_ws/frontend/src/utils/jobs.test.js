import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  JOB_TABS,
  activeTabKey,
  describeSort,
  filterJobs,
  filtersForTab,
  isDefaultView,
  normalizeRequirement,
  payAmount,
  requirementsOf,
  sortJobs
} from './jobs.js';

const NOW = Date.parse('2026-11-16T12:00:00Z');
const daysAgo = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();
const req = (n) => Array.from({ length: n }, (_, i) => ({ skillName: `S${i}`, minRating: 3 }));

// ids are time-prefixed hex like the real ones: a later id is a later posting
const jobs = [
  { id: '6a0000000000000000000001', title: 'Cloud Engineer Intern', companyName: 'Ferncrest', location: 'Work from office · Mumbai', jobType: 'Full-time internship', salaryRange: '₹12,000/month', requirements: req(3), postedAt: daysAgo(3) },
  { id: '6a0000000000000000000002', title: 'java Backend Engineer', companyName: 'Ferncrest', location: 'Work from office · Pune', jobType: 'Full-time job', salaryRange: '₹1,20,000/month', requirements: req(5), postedAt: daysAgo(20) },
  { id: '6a0000000000000000000003', title: 'Designer', companyName: 'Orbitly', location: 'Remote', jobType: 'Part-time internship', salaryRange: '₹9,000/month', requirements: [], postedAt: daysAgo(45) },
  { id: '6a0000000000000000000004', title: 'Odd one', companyName: 'Orbitly', location: 'Hyderabad', jobType: 'Not specified', salaryRange: 'Not specified', requirements: req(1), postedAt: daysAgo(1) },
  { id: '6a0000000000000000000005', title: 'Logo task', companyName: 'Orbitly', location: 'Remote', jobType: 'Gig', salaryRange: 'Negotiable', postedAt: daysAgo(10) },
  { id: '6a0000000000000000000006', title: 'Plain', companyName: 'X', location: 'Y', jobType: 'Job', salaryRange: '₹30,000/month (hidden from candidates)', requirements: req(2) }
];
const ids = (rows) => rows.map((j) => Number(j.id.slice(-1)));

/* ---- requirements ---- */

test('normalizeRequirement reads the stored field names', () => {
  assert.deepEqual(normalizeRequirement({ skillName: 'React', minRating: 4 }), { name: 'React', minRating: 4 });
});

test('normalizeRequirement reads the legacy field names', () => {
  assert.deepEqual(normalizeRequirement({ skill: 'SQL', rating: 7 }), { name: 'SQL', minRating: 7 });
});

test('normalizeRequirement never invents a rating', () => {
  assert.deepEqual(normalizeRequirement({ skillName: 'Go' }), { name: 'Go', minRating: null });
  assert.deepEqual(normalizeRequirement({ skillName: 'Go', minRating: 0 }), { name: 'Go', minRating: null });
  assert.deepEqual(normalizeRequirement({ skillName: 'Go', minRating: 'abc' }), { name: 'Go', minRating: null });
});

test('requirementsOf drops nameless entries and tolerates a missing list', () => {
  assert.deepEqual(requirementsOf({ requirements: [{ skillName: 'A', minRating: 1 }, { minRating: 3 }, {}] }), [{ name: 'A', minRating: 1 }]);
  assert.deepEqual(requirementsOf({}), []);
  assert.deepEqual(requirementsOf(null), []);
  assert.deepEqual(requirementsOf({ requirements: 'oops' }), []);
});

/* ---- pay ---- */

test('payAmount reads the monthly amount, with Indian digit grouping', () => {
  assert.equal(payAmount({ salaryRange: '₹12,000/month' }), 12000);
  assert.equal(payAmount({ salaryRange: '₹1,20,000/month' }), 120000);
  assert.equal(payAmount({ salaryRange: '₹30,000/month (hidden from candidates)' }), 30000);
});

test('payAmount is null for free text, "Not specified" and missing values (never a guess)', () => {
  assert.equal(payAmount({ salaryRange: 'Not specified' }), null);
  assert.equal(payAmount({ salaryRange: 'Negotiable' }), null);
  assert.equal(payAmount({ salaryRange: 'Up to 20k' }), null);
  assert.equal(payAmount({}), null);
  assert.equal(payAmount(null), null);
});

/* ---- tabs: presets of the column filters ---- */

test('job tabs separate jobs from internships; gigs and unspecified only appear under All', () => {
  const inTab = (key) => ids(jobs.filter(JOB_TABS.find((t) => t.key === key).test));
  assert.deepEqual(inTab('all'), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(inTab('jobs'), [2, 6]);
  assert.deepEqual(inTab('internships'), [1, 3]);
  assert.deepEqual(JOB_TABS.map((t) => t.key), ['all', 'jobs', 'internships']);
});

test('a tab and the column filter it stands for show the same rows', () => {
  for (const tab of JOB_TABS) {
    const byFilter = filterJobs(jobs, { filters: filtersForTab(tab.key), now: NOW });
    assert.deepEqual(ids(byFilter), ids(jobs.filter(tab.test)), tab.key);
  }
});

test('activeTabKey names the tab the filters equal, and null for a custom mix', () => {
  assert.equal(activeTabKey(DEFAULT_FILTERS), 'all');
  assert.equal(activeTabKey({}), 'all');
  assert.equal(activeTabKey(filtersForTab('jobs')), 'jobs');
  assert.equal(activeTabKey(filtersForTab('internships')), 'internships');
  assert.equal(activeTabKey({ ...DEFAULT_FILTERS, type: 'jobs', pay: 'listed' }), null);
  assert.equal(activeTabKey({ ...DEFAULT_FILTERS, type: 'fulltime' }), null);
  assert.equal(activeTabKey({ ...DEFAULT_FILTERS, posted: '7d' }), null);
});

/* ---- filters ---- */

test('filterJobs searches title, company, location and type', () => {
  const found = (query) => ids(filterJobs(jobs, { query, now: NOW }));
  assert.deepEqual(found('cloud'), [1]);
  assert.deepEqual(found('orbitly'), [3, 4, 5]);
  assert.deepEqual(found('remote'), [3, 5]);
  assert.deepEqual(found('part-time'), [3]);
  assert.deepEqual(found('zzz'), []);
  assert.deepEqual(ids(filterJobs(jobs, { filters: filtersForTab('internships'), query: 'mumbai', now: NOW })), [1]);
});

test('type filter: jobs, internships, full-time and part-time', () => {
  const by = (type) => ids(filterJobs(jobs, { filters: { type }, now: NOW }));
  assert.deepEqual(by('all'), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(by('jobs'), [2, 6]);
  assert.deepEqual(by('internships'), [1, 3]);
  assert.deepEqual(by('fulltime'), [1, 2]);
  assert.deepEqual(by('parttime'), [3]);
});

test('pay filter: listed or not specified', () => {
  const by = (pay) => ids(filterJobs(jobs, { filters: { pay }, now: NOW }));
  assert.deepEqual(by('listed'), [1, 2, 3, 5, 6]); // "Negotiable" is pay text, so it counts as listed
  assert.deepEqual(by('none'), [4]);
});

test('skills filter: with requirements or none (a missing list counts as none)', () => {
  const by = (skills) => ids(filterJobs(jobs, { filters: { skills }, now: NOW }));
  assert.deepEqual(by('has'), [1, 2, 4, 6]);
  assert.deepEqual(by('none'), [3, 5]);
});

test('posted filter: last 7 days, last 30 days, older; undated postings match none of them', () => {
  const by = (posted) => ids(filterJobs(jobs, { filters: { posted }, now: NOW }));
  assert.deepEqual(by('7d'), [1, 4]);
  assert.deepEqual(by('30d'), [1, 2, 4, 5]);
  assert.deepEqual(by('older'), [3]);
  assert.deepEqual(by('all'), [1, 2, 3, 4, 5, 6]);
});

test('filters combine', () => {
  assert.deepEqual(ids(filterJobs(jobs, { filters: { type: 'fulltime', posted: '30d' }, now: NOW })), [1, 2]);
  assert.deepEqual(ids(filterJobs(jobs, { filters: { type: 'internships', skills: 'none' }, now: NOW })), [3]);
  assert.deepEqual(ids(filterJobs(jobs, { filters: { type: 'jobs', posted: '7d' }, now: NOW })), []);
});

/* ---- sorting ---- */

test('the default order is newest posted first, and a posting with no date is the oldest', () => {
  assert.deepEqual(DEFAULT_SORT, { key: 'posted', dir: 'desc' });
  assert.deepEqual(ids(sortJobs(jobs)), [4, 1, 5, 2, 3, 6]);
  assert.deepEqual(ids(sortJobs(jobs, { key: 'posted', dir: 'asc' })), [3, 2, 5, 1, 4, 6]);
});

test('undated postings always come last, whichever way the date sort goes', () => {
  assert.equal(ids(sortJobs(jobs, { key: 'posted', dir: 'desc' })).at(-1), 6);
  assert.equal(ids(sortJobs(jobs, { key: 'posted', dir: 'asc' })).at(-1), 6);
});

test('title and company sort ignore case; ties fall back to newest first', () => {
  assert.deepEqual(ids(sortJobs(jobs, { key: 'title', dir: 'asc' })), [1, 3, 2, 5, 4, 6]);
  assert.deepEqual(ids(sortJobs(jobs, { key: 'title', dir: 'desc' })), [6, 4, 5, 2, 3, 1]);
  // Ferncrest (1, 2), Orbitly (3, 4, 5), X (6): inside a company, the newer posting is first
  assert.deepEqual(ids(sortJobs(jobs, { key: 'company', dir: 'asc' })), [1, 2, 4, 5, 3, 6]);
  assert.deepEqual(ids(sortJobs(jobs, { key: 'company', dir: 'desc' })), [6, 4, 5, 3, 1, 2]);
});

test('pay sorts by amount; pay without an amount goes last in both directions', () => {
  assert.deepEqual(ids(sortJobs(jobs, { key: 'pay', dir: 'desc' })), [2, 6, 1, 3, 4, 5]);
  assert.deepEqual(ids(sortJobs(jobs, { key: 'pay', dir: 'asc' })), [3, 1, 6, 2, 4, 5]);
});

test('skills required sorts by count', () => {
  assert.deepEqual(ids(sortJobs(jobs, { key: 'skills', dir: 'desc' })), [2, 1, 6, 4, 5, 3]); // 5 before 3: same count, newer first
  // 3 and 5 both need none: the newer posting (5) goes first
  assert.deepEqual(ids(sortJobs(jobs, { key: 'skills', dir: 'asc' })), [5, 3, 4, 6, 1, 2]);
});

test('type sorts A to Z on the label', () => {
  // Full-time internship, Full-time job, Gig, Job, Not specified, Part-time internship
  assert.deepEqual(ids(sortJobs(jobs, { key: 'type', dir: 'asc' })), [1, 2, 5, 6, 4, 3]);
  assert.deepEqual(ids(sortJobs(jobs, { key: 'type', dir: 'desc' })), [3, 4, 6, 5, 2, 1]);
});

test('sorting never changes the list it was given, and an unknown column sorts by posting date', () => {
  const copy = [...jobs];
  sortJobs(jobs, { key: 'pay', dir: 'desc' });
  assert.deepEqual(jobs, copy);
  assert.deepEqual(ids(sortJobs(jobs, { key: 'nonsense', dir: 'asc' })), ids(sortJobs(jobs, { key: 'posted', dir: 'asc' })));
});

test('the same dates in a different input order give the same result', () => {
  const shuffled = [jobs[3], jobs[5], jobs[0], jobs[4], jobs[2], jobs[1]];
  assert.deepEqual(ids(sortJobs(shuffled)), ids(sortJobs(jobs)));
});

/* ---- words and reset ---- */

test('describeSort says the order in words, and falls back to the default wording', () => {
  assert.equal(describeSort(DEFAULT_SORT), 'newest posted first');
  assert.equal(describeSort({ key: 'pay', dir: 'desc' }), 'highest pay first');
  assert.equal(describeSort({ key: 'skills', dir: 'asc' }), 'fewest skills required first');
  assert.equal(describeSort({ key: 'x', dir: 'asc' }), 'newest posted first');
});

test('isDefaultView is true only for newest first with no column filter', () => {
  assert.equal(isDefaultView({ sort: DEFAULT_SORT, filters: DEFAULT_FILTERS }), true);
  assert.equal(isDefaultView({ sort: DEFAULT_SORT, filters: {} }), true);
  assert.equal(isDefaultView({ sort: { key: 'posted', dir: 'asc' }, filters: DEFAULT_FILTERS }), false);
  assert.equal(isDefaultView({ sort: DEFAULT_SORT, filters: { ...DEFAULT_FILTERS, type: 'jobs' } }), false);
});
