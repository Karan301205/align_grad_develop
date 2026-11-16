const { test } = require('node:test');
const assert = require('node:assert/strict');
const { QUERIES, WEEKS, shapeMetrics } = require('./opportunityMetrics');

const rows = (...r) => ({ rows: r });

test('shapeMetrics tolerates a database with nothing in it', () => {
  const out = shapeMetrics({}, new Date('2026-11-16T10:00:00Z'));
  assert.equal(out.generatedAt, '2026-11-16T10:00:00.000Z');
  assert.deepEqual(out.listings, { jobs: 0, internships: 0, other: 0, gigs: 0, openJobs: 0, openInternships: 0, openGigs: 0, gigsInProgress: 0 });
  assert.deepEqual(out.activity, { applications: 0, pitches: 0 });
  assert.deepEqual(out.workModes, []);
  assert.deepEqual(out.weekly, []);
  assert.deepEqual(out.popular, []);
  assert.deepEqual(out.gigs, { byStatus: [], byCategory: [], openBudget: [], hired: 0 });
});

test('shapeMetrics turns postgres strings and nulls into plain numbers', () => {
  const out = shapeMetrics({
    listings: rows({ jobs: '18', internships: '6', other: null, openJobs: '17', openInternships: undefined }),
    activity: rows({ applications: '9', pitches: 'nope' })
  });
  assert.equal(out.listings.jobs, 18);
  assert.equal(out.listings.internships, 6);
  assert.equal(out.listings.other, 0);
  assert.equal(out.listings.openJobs, 17);
  assert.equal(out.listings.openInternships, 0);
  assert.equal(out.activity.applications, 9);
  assert.equal(out.activity.pitches, 0);
});

test('gig totals and the open / in-progress counts come from the status rows', () => {
  const out = shapeMetrics({
    gigStatus: rows({ status: 'OPEN', count: 25 }, { status: 'IN_PROGRESS', count: 3 }, { status: 'CLOSED', count: 1 })
  });
  assert.equal(out.listings.gigs, 29);
  assert.equal(out.listings.openGigs, 25);
  assert.equal(out.listings.gigsInProgress, 3);
  assert.deepEqual(out.gigs.byStatus.map((s) => s.status), ['OPEN', 'IN_PROGRESS', 'CLOSED']);
});

test('a status with no gigs counts as zero rather than undefined', () => {
  const out = shapeMetrics({ gigStatus: rows({ status: 'COMPLETED', count: 2 }) });
  assert.equal(out.listings.openGigs, 0);
  assert.equal(out.listings.gigsInProgress, 0);
  assert.equal(out.listings.gigs, 2);
});

test('budgets, categories and hires are passed through with numeric values', () => {
  const out = shapeMetrics({
    gigBudget: rows({ currency: 'INR', total: '125000.5', count: '4' }, { currency: null, total: 10, count: 1 }),
    gigCategories: rows({ name: 'Web Development', count: '3' }),
    gigHired: rows({ hired: '2' })
  });
  assert.deepEqual(out.gigs.openBudget, [{ currency: 'INR', total: 125000.5, count: 4 }, { currency: 'INR', total: 10, count: 1 }]);
  assert.deepEqual(out.gigs.byCategory, [{ name: 'Web Development', count: 3 }]);
  assert.equal(out.gigs.hired, 2);
});

test('weekly rows keep their order and every series is numeric', () => {
  const out = shapeMetrics({
    weekly: rows(
      { weekStart: '2026-11-02', jobs: '1', internships: '0', gigs: '2', applications: '5', pitches: '1' },
      { weekStart: '2026-11-09', jobs: 0, internships: 3, gigs: 0, applications: 0, pitches: 0 }
    )
  });
  assert.deepEqual(out.weekly.map((w) => w.weekStart), ['2026-11-02', '2026-11-09']);
  assert.deepEqual(out.weekly[0], { weekStart: '2026-11-02', jobs: 1, internships: 0, gigs: 2, applications: 5, pitches: 1 });
});

test('popular postings keep their kind, company and applicant count', () => {
  const out = shapeMetrics({
    popular: rows(
      { type: 'GIG', id: 'g1', title: 'Logo task', company: null, count: '4' },
      { type: 'INTERNSHIP', id: 'j1', title: 'Cloud Intern', company: 'Ferncrest', count: 2 }
    )
  });
  assert.deepEqual(out.popular, [
    { type: 'GIG', id: 'g1', title: 'Logo task', company: '', count: 4 },
    { type: 'INTERNSHIP', id: 'j1', title: 'Cloud Intern', company: 'Ferncrest', count: 2 }
  ]);
});

test('every shaped query has SQL, and all of them only read data', () => {
  const names = ['listings', 'workModes', 'activity', 'gigStatus', 'gigCategories', 'gigBudget', 'gigHired', 'weekly', 'popular'];
  assert.deepEqual(Object.keys(QUERIES).sort(), [...names].sort());
  for (const [name, sql] of Object.entries(QUERIES)) {
    assert.match(sql.trim(), /^(SELECT|WITH)\b/i, `${name} must start with SELECT or WITH`);
    assert.doesNotMatch(sql, /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE)\b/i, `${name} must not write`);
  }
});

test('the weekly query covers the documented number of weeks', () => {
  assert.equal(WEEKS, 8);
  assert.match(QUERIES.weekly, new RegExp(`interval '${WEEKS - 1} weeks'`));
});
