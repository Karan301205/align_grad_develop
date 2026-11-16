import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANDIDATE_TABS,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  activeTabKey,
  applicationsOf,
  describeSort,
  filterCandidates,
  filtersForTab,
  gradeLabel,
  hasSkills,
  hasVideo,
  isDefaultView,
  periodLabel,
  skillRatings,
  sortCandidates,
  verifiedSkillCount
} from './candidates.js';

const NOW = Date.parse('2026-11-16T12:00:00Z');
const daysAgo = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();
const apps = (jobs, internships, gigs) => ({ jobs, internships, gigs, total: jobs + internships + gigs });

// ids are time-prefixed hex like the real ones: a later id is a later registration
const candidates = [
  { id: '6a0000000000000000000001', name: 'Sai Vivek', email: 'sai@x.com', username: 'sai', nationality: 'Indian', createdAt: daysAgo(3), introVideoUrl: 'https://v/1', skills: [{ name: 'Python', rating: 4, verifiedRating: 6 }, { name: 'SQL', rating: 2 }], applications: apps(2, 1, 0) },
  { id: '6a0000000000000000000002', name: 'rahul Verma', email: 'rahul@x.com', username: 'rv', createdAt: daysAgo(20), skills: [{ name: 'Excel', rating: 1, verifiedRating: 0 }], applications: apps(0, 0, 3) },
  { id: '6a0000000000000000000003', name: 'Fatima Khan', email: 'fatima@x.com', username: 'fk', createdAt: daysAgo(45), introVideoUrl: 'https://v/3', skills: [], applications: apps(0, 0, 0) },
  { id: '6a0000000000000000000004', name: 'No Skills Field', email: 'nsf@x.com', createdAt: daysAgo(1), applications: apps(5, 0, 0) },
  { id: '6a0000000000000000000005', name: 'Undated', email: 'u@x.com', skills: [{ name: 'Go', rating: 3, verifiedRating: 5 }, { name: 'Rust', rating: 3, verifiedRating: 7 }], introVideoUrl: 'https://v/5' }
];
const ids = (rows) => rows.map((c) => Number(c.id.slice(-1)));

/* ---- small facts ---- */

test('verifiedSkillCount counts only skills with a passing verified rating', () => {
  assert.equal(verifiedSkillCount(candidates[0]), 1);
  assert.equal(verifiedSkillCount(candidates[1]), 0);
  assert.equal(verifiedSkillCount(candidates[2]), 0);
  assert.equal(verifiedSkillCount(candidates[3]), 0);
  assert.equal(verifiedSkillCount(null), 0);
});

test('hasSkills and hasVideo tolerate missing fields', () => {
  assert.equal(hasSkills(candidates[0]), true);
  assert.equal(hasSkills(candidates[3]), false);
  assert.equal(hasVideo(candidates[0]), true);
  assert.equal(hasVideo(candidates[1]), false);
});

test('applicationsOf returns the counts, or null when a candidate came without them', () => {
  assert.deepEqual(applicationsOf(candidates[0]), { jobs: 2, internships: 1, gigs: 0, total: 3 });
  assert.equal(applicationsOf(candidates[4]), null);
  assert.equal(applicationsOf(null), null);
  assert.deepEqual(applicationsOf({ applications: { jobs: 'x', internships: null, gigs: '2', total: 2 } }), { jobs: 0, internships: 0, gigs: 2, total: 2 });
});

/* ---- default view ---- */

test('the default order is newest joined first', () => {
  assert.deepEqual(DEFAULT_SORT, { key: 'joined', dir: 'desc' });
  // joined: id4 (1d), id1 (3d), id2 (20d), id3 (45d); id5 has no date and goes last
  assert.deepEqual(ids(sortCandidates(candidates)), [4, 1, 2, 3, 5]);
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'joined', dir: 'asc' })), [3, 2, 1, 4, 5]);
});

test('sorting never changes the list it is given', () => {
  const before = ids(candidates);
  sortCandidates(candidates, { key: 'name', dir: 'asc' });
  assert.deepEqual(ids(candidates), before);
});

test('a candidate with no join date counts as the oldest, so mixed lists still sort in one consistent order', () => {
  // ids chosen so that "by date" and "by id" disagree: a dated A newer than a dated B, yet A.id < B.id, with an undated C between them
  const mixed = [
    { id: '6a0000000000000000000001', name: 'A', createdAt: daysAgo(1) },
    { id: '6a0000000000000000000002', name: 'C' },
    { id: '6a0000000000000000000003', name: 'B', createdAt: daysAgo(5) }
  ];
  assert.deepEqual(sortCandidates(mixed, { key: 'skills', dir: 'desc' }).map((c) => c.name), ['A', 'B', 'C']); // all tie on 0 skills: newest first, undated last
  assert.deepEqual(sortCandidates(mixed, { key: 'video', dir: 'asc' }).map((c) => c.name), ['A', 'B', 'C']);
  // the result must not depend on the order the list arrives in
  for (const order of [[0, 1, 2], [2, 1, 0], [1, 0, 2], [1, 2, 0]]) {
    assert.deepEqual(sortCandidates(order.map((i) => mixed[i]), { key: 'skills', dir: 'desc' }).map((c) => c.name), ['A', 'B', 'C']);
  }
});

test('with no dates at all, the time inside the id decides', () => {
  const noDates = [{ id: '6a0000000000000000000001', name: 'Old' }, { id: '6a0000000000000000000009', name: 'New' }, { id: '6a0000000000000000000005', name: 'Mid' }];
  assert.deepEqual(sortCandidates(noDates).map((c) => c.name), ['New', 'Mid', 'Old']);
});

/* ---- sorting by every column ---- */

test('names sort A to Z and Z to A without caring about capital letters', () => {
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'name', dir: 'asc' })), [3, 4, 2, 1, 5]);
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'name', dir: 'desc' })), [5, 1, 2, 4, 3]);
});

test('skills sort by how many are listed, ties newest first', () => {
  // skills listed: id1 2, id2 1, id3 0, id4 0, id5 2. Ties: newest first (the undated candidate counts as oldest).
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'skills', dir: 'desc' })), [1, 5, 2, 4, 3]);
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'skills', dir: 'asc' })), [4, 3, 2, 1, 5]);
});

test('verified skills sort by how many passed a test', () => {
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'verified', dir: 'desc' })), [5, 1, 4, 2, 3]);
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'verified', dir: 'asc' })), [4, 2, 3, 1, 5]);
});

test('video résumé sorts uploaded-first or none-first', () => {
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'video', dir: 'desc' })), [1, 3, 5, 4, 2]);
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'video', dir: 'asc' })), [4, 2, 1, 3, 5]);
});

test('applications sort by the total, and a candidate with no counts counts as zero', () => {
  // totals: id1 3, id2 3, id3 0, id4 5, id5 unknown (0)
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'applications', dir: 'desc' })), [4, 1, 2, 3, 5]);
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'applications', dir: 'asc' })), [3, 5, 1, 2, 4]);
});

test('an unknown sort key behaves like the default, and an empty list is fine', () => {
  assert.deepEqual(ids(sortCandidates(candidates, { key: 'nonsense', dir: 'asc' })), ids(sortCandidates(candidates, { key: 'joined', dir: 'asc' })));
  assert.deepEqual(sortCandidates([], { key: 'name', dir: 'asc' }), []);
});

/* ---- column filters ---- */

test('the skills, verified and video filters each keep the right candidates', () => {
  const f = (filters) => ids(filterCandidates(candidates, { filters, now: NOW }));
  assert.deepEqual(f({ skills: 'has' }), [1, 2, 5]);
  assert.deepEqual(f({ skills: 'none' }), [3, 4]);
  assert.deepEqual(f({ verified: 'has' }), [1, 5]);
  assert.deepEqual(f({ verified: 'none' }), [2, 3, 4]);
  assert.deepEqual(f({ video: 'yes' }), [1, 3, 5]);
  assert.deepEqual(f({ video: 'none' }), [2, 4]);
});

test('the applications filter keeps jobs, internships, gigs, any, or none', () => {
  const f = (applied) => ids(filterCandidates(candidates, { filters: { applied }, now: NOW }));
  assert.deepEqual(f('jobs'), [1, 4]);
  assert.deepEqual(f('internships'), [1]);
  assert.deepEqual(f('gigs'), [2]);
  assert.deepEqual(f('any'), [1, 2, 4]);
  assert.deepEqual(f('none'), [3, 5]); // no applications, and unknown counts count as none
});

test('the joined filter is relative to now, and skips candidates whose join date is unknown', () => {
  const f = (joined) => ids(filterCandidates(candidates, { filters: { joined }, now: NOW }));
  assert.deepEqual(f('7d'), [1, 4]);
  assert.deepEqual(f('30d'), [1, 2, 4]);
  assert.deepEqual(f('older'), [3]);
  assert.deepEqual(f('all'), [1, 2, 3, 4, 5]);
});

test('filters and the search box combine', () => {
  const f = (filters, query) => ids(filterCandidates(candidates, { filters, query, now: NOW }));
  assert.deepEqual(f({ skills: 'has', video: 'yes' }), [1, 5]);
  assert.deepEqual(f({ skills: 'has', video: 'yes' }, 'rust'), [5]);
  assert.deepEqual(f({ skills: 'has', video: 'yes' }, 'zzz'), []);
  assert.deepEqual(f({}, 'VERMA'), [2]);
  assert.deepEqual(f({}, 'python'), [1]);
  assert.deepEqual(f({ applied: 'any' }, 'x.com'), [1, 2, 4]);
});

/* ---- tabs are presets of the filters ---- */

test('every tab maps to filters, and every tab count test agrees with its filters', () => {
  assert.equal(new Set(CANDIDATE_TABS.map((t) => t.key)).size, CANDIDATE_TABS.length);
  for (const tab of CANDIDATE_TABS) {
    const byFilters = ids(filterCandidates(candidates, { filters: filtersForTab(tab.key), now: NOW }));
    const byTest = ids(candidates.filter(tab.test));
    assert.deepEqual(byFilters, byTest, `tab "${tab.key}"`);
  }
});

test('activeTabKey names the tab the filters equal, and null for a custom mix', () => {
  assert.equal(activeTabKey(DEFAULT_FILTERS), 'all');
  assert.equal(activeTabKey({}), 'all');
  assert.equal(activeTabKey({ skills: 'has' }), 'skills');
  assert.equal(activeTabKey({ skills: 'none' }), 'noSkills');
  assert.equal(activeTabKey({ verified: 'has' }), 'verified');
  assert.equal(activeTabKey({ video: 'none' }), 'noVideo');
  assert.equal(activeTabKey({ skills: 'has', video: 'none' }), null);
  assert.equal(activeTabKey({ applied: 'jobs' }), null);
  assert.equal(activeTabKey({ joined: '7d' }), null);
  assert.equal(activeTabKey(filtersForTab('noVideo')), 'noVideo');
});

test('an unknown tab key falls back to All', () => {
  assert.deepEqual(filtersForTab('bogus'), DEFAULT_FILTERS);
});

/* ---- words and the reset ---- */

test('describeSort names every order in words', () => {
  assert.equal(describeSort(DEFAULT_SORT), 'newest joined first');
  assert.equal(describeSort({ key: 'applications', dir: 'desc' }), 'most applications first');
  assert.equal(describeSort({ key: 'video', dir: 'asc' }), 'no video résumé first');
  assert.equal(describeSort({ key: 'weird', dir: 'asc' }), 'newest joined first');
});

test('isDefaultView is false as soon as anything is changed', () => {
  const base = { sort: DEFAULT_SORT, filters: DEFAULT_FILTERS };
  assert.equal(isDefaultView(base), true);
  assert.equal(isDefaultView({ ...base, filters: {} }), true);
  assert.equal(isDefaultView({ ...base, sort: { key: 'name', dir: 'asc' } }), false);
  assert.equal(isDefaultView({ ...base, sort: { key: 'joined', dir: 'asc' } }), false);
  assert.equal(isDefaultView({ ...base, filters: { ...DEFAULT_FILTERS, applied: 'gigs' } }), false);
  assert.equal(isDefaultView({ ...base, filters: filtersForTab('skills') }), false);
});

/* ---- candidate profile labels (unchanged) ---- */

test('periodLabel formats ranges and never assumes an open end means "present"', () => {
  assert.equal(periodLabel({ startDate: '2022-08', endDate: '2026-05' }), '2022-08 – 2026-05');
  assert.equal(periodLabel({ startDate: '2024-01', currentlyWorking: true }), '2024-01 – Present');
  assert.equal(periodLabel({ startDate: '2024-01', endDate: '2025-01', currentlyWorking: true }), '2024-01 – Present');
  assert.equal(periodLabel({ startDate: '2024-01' }), 'Since 2024-01');
  assert.equal(periodLabel({ endDate: '2026-05' }), 'Until 2026-05');
  assert.equal(periodLabel({ currentlyWorking: true }), 'Present');
  assert.equal(periodLabel({}), '');
  assert.equal(periodLabel(), '');
});

test('gradeLabel needs both a type and a value', () => {
  assert.equal(gradeLabel({ gradeType: 'CGPA', gradeValue: '8.1' }), 'CGPA 8.1');
  assert.equal(gradeLabel({ gradeType: 'CGPA' }), '');
  assert.equal(gradeLabel({ gradeValue: '8.1' }), '');
  assert.equal(gradeLabel(), '');
});

test('skillRatings separates the self rating from the verified one', () => {
  assert.deepEqual(skillRatings({ name: 'Python', rating: 4, verifiedRating: 6 }), { self: 4, verified: 6 });
  assert.deepEqual(skillRatings({ name: 'SQL', rating: 2 }), { self: 2, verified: null });
  assert.deepEqual(skillRatings({ name: 'Excel', rating: 1, verifiedRating: 0 }), { self: 1, verified: null });
  assert.deepEqual(skillRatings({}), { self: null, verified: null });
  assert.deepEqual(skillRatings(null), { self: null, verified: null });
});
