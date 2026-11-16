const { test } = require('node:test');
const assert = require('node:assert/strict');
const { QUERIES, applicationCountsByUser, withApplicationCounts } = require('./applicationCounts');

const rows = (...r) => ({ rows: r });

test('a candidate who has applied to nothing gets zeros, not undefined', () => {
  const out = withApplicationCounts([{ id: 'u1', name: 'A' }], {});
  assert.deepEqual(out[0].applications, { jobs: 0, internships: 0, gigs: 0, total: 0 });
  assert.equal(out[0].name, 'A');
});

test('jobs, internships and gigs are added up per candidate, and the total is their sum', () => {
  const results = {
    jobApplications: rows({ userId: 'u1', jobs: '3', internships: '1' }, { userId: 'u2', jobs: 0, internships: 2 }),
    gigPitches: rows({ userId: 'u1', gigs: '2' }, { userId: 'u3', gigs: 1 })
  };
  assert.deepEqual(applicationCountsByUser(results), {
    u1: { jobs: 3, internships: 1, gigs: 2, total: 6 },
    u2: { jobs: 0, internships: 2, gigs: 0, total: 2 },
    u3: { jobs: 0, internships: 0, gigs: 1, total: 1 }
  });
});

test('a candidate who only pitched on gigs still shows up', () => {
  const out = withApplicationCounts([{ id: 'u3' }], { gigPitches: rows({ userId: 'u3', gigs: 4 }) });
  assert.deepEqual(out[0].applications, { jobs: 0, internships: 0, gigs: 4, total: 4 });
});

test('bad numbers from the database count as zero', () => {
  const out = withApplicationCounts([{ id: 'u1' }], { jobApplications: rows({ userId: 'u1', jobs: null, internships: 'x' }) });
  assert.equal(out[0].applications.total, 0);
});

test('counts for a user that is not in the list are ignored', () => {
  const out = withApplicationCounts([{ id: 'u1' }], { jobApplications: rows({ userId: 'someone-else', jobs: 9, internships: 0 }) });
  assert.equal(out[0].applications.total, 0);
});

test('the original student objects are not changed', () => {
  const student = { id: 'u1' };
  withApplicationCounts([student], { jobApplications: rows({ userId: 'u1', jobs: 1, internships: 0 }) });
  assert.equal(student.applications, undefined);
});

test('the queries only read, and match a candidate by either of their ids', () => {
  for (const [name, sql] of Object.entries(QUERIES)) {
    assert.match(sql.trim(), /^SELECT\b/i, `${name} must be a SELECT`);
    assert.doesNotMatch(sql, /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE)\b/i);
    assert.match(sql, /p\."id" = .*OR p\."userId" = |p\."userId" = .*OR p\."id" = /s, `${name} should match a Profile id or a User id`);
  }
});
