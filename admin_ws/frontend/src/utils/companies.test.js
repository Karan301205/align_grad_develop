import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SORT, describeSort, filterCompanies, isDefaultView, sortCompanies } from './companies.js';

const company = (id, name, extra = {}) => ({
  id,
  companyName: name,
  email: `${name.toLowerCase().replace(/\W/g, '')}@x.com`,
  registeredAt: null,
  verificationStatus: 'NOT_SUBMITTED',
  verificationSubmittedAt: null,
  jobs: [],
  company: null,
  ...extra
});

// ids are time-prefixed hex like the real ones: a later id is a later registration
const list = [
  company('6a0000000000000000000001', 'Alpha', { registeredAt: '2026-10-01T10:00:00Z', verificationStatus: 'APPROVED', jobs: [{}, {}, {}], verificationSubmittedAt: '2026-10-02T10:00:00Z', company: { recruiterName: 'Zed Zee', industry: 'Software', location: 'Pune' } }),
  company('6a0000000000000000000002', 'bravo', { registeredAt: '2026-11-10T10:00:00Z', verificationStatus: 'PENDING', jobs: [{}], verificationSubmittedAt: '2026-11-11T10:00:00Z', company: { recruiterName: 'Amy Ade', industry: 'EdTech', location: 'Mumbai' } }),
  company('6a0000000000000000000003', 'Charlie', { registeredAt: '2026-11-15T10:00:00Z', verificationStatus: 'REJECTED', company: { recruiterName: 'Bob Bay' } }),
  company('6a0000000000000000000004', 'Delta', { registeredAt: '2026-09-01T10:00:00Z', verificationStatus: 'NOT_SUBMITTED', jobs: [{}, {}] }),
  company('6a0000000000000000000005', 'Echo', { registeredAt: '2026-11-12T10:00:00Z', verificationStatus: 'APPROVED', verificationSubmittedAt: '2026-11-13T10:00:00Z', company: { recruiterName: '   ' } })
];
const names = (rows) => rows.map((c) => c.companyName);

test('the default order is newest registered first', () => {
  assert.deepEqual(DEFAULT_SORT, { key: 'registered', dir: 'desc' });
  assert.deepEqual(names(sortCompanies(list)), ['Charlie', 'Echo', 'bravo', 'Alpha', 'Delta']);
  assert.deepEqual(names(sortCompanies(list, { key: 'registered', dir: 'asc' })), ['Delta', 'Alpha', 'bravo', 'Echo', 'Charlie']);
});

test('sorting never changes the list it is given', () => {
  const before = names(list);
  sortCompanies(list, { key: 'name', dir: 'asc' });
  assert.deepEqual(names(list), before);
});

test('company names sort A to Z and Z to A without caring about capital letters', () => {
  assert.deepEqual(names(sortCompanies(list, { key: 'name', dir: 'asc' })), ['Alpha', 'bravo', 'Charlie', 'Delta', 'Echo']);
  assert.deepEqual(names(sortCompanies(list, { key: 'name', dir: 'desc' })), ['Echo', 'Delta', 'Charlie', 'bravo', 'Alpha']);
});

test('contacts sort by recruiter name, and companies with no recruiter name stay last in both directions', () => {
  assert.deepEqual(names(sortCompanies(list, { key: 'contact', dir: 'asc' })), ['bravo', 'Charlie', 'Alpha', 'Echo', 'Delta']);
  assert.deepEqual(names(sortCompanies(list, { key: 'contact', dir: 'desc' })), ['Alpha', 'Charlie', 'bravo', 'Echo', 'Delta']);
});

test('verification sorts needs-review-first or approved-first', () => {
  const asc = sortCompanies(list, { key: 'status', dir: 'asc' }).map((c) => c.verificationStatus);
  assert.deepEqual(asc, ['PENDING', 'REJECTED', 'NOT_SUBMITTED', 'APPROVED', 'APPROVED']);
  assert.deepEqual(sortCompanies(list, { key: 'status', dir: 'desc' }).map((c) => c.verificationStatus), ['APPROVED', 'APPROVED', 'NOT_SUBMITTED', 'REJECTED', 'PENDING']);
});

test('jobs sort by count, ties fall back to newest first', () => {
  assert.deepEqual(names(sortCompanies(list, { key: 'jobs', dir: 'desc' })), ['Alpha', 'Delta', 'bravo', 'Charlie', 'Echo']);
  assert.deepEqual(names(sortCompanies(list, { key: 'jobs', dir: 'asc' })), ['Charlie', 'Echo', 'bravo', 'Delta', 'Alpha']);
});

test('submitted sorts by date and companies that never submitted stay last in both directions', () => {
  // submitted: Alpha 2 Oct, bravo 11 Nov, Echo 13 Nov; Charlie and Delta never submitted (newest registered first among them)
  assert.deepEqual(names(sortCompanies(list, { key: 'submitted', dir: 'desc' })), ['Echo', 'bravo', 'Alpha', 'Charlie', 'Delta']);
  assert.deepEqual(names(sortCompanies(list, { key: 'submitted', dir: 'asc' })), ['Alpha', 'bravo', 'Echo', 'Charlie', 'Delta']);
});

test('a missing registration date falls back to the time inside the id', () => {
  const noDates = [company('6a0000000000000000000001', 'Old'), company('6a0000000000000000000009', 'New'), company('6a0000000000000000000005', 'Mid')];
  assert.deepEqual(names(sortCompanies(noDates)), ['New', 'Mid', 'Old']);
});

test('a company with no registration date counts as the oldest, whatever order the list arrives in', () => {
  const mixed = [
    company('6a0000000000000000000001', 'A', { registeredAt: '2026-11-10T00:00:00Z' }),
    company('6a0000000000000000000002', 'C'),
    company('6a0000000000000000000003', 'B', { registeredAt: '2026-11-01T00:00:00Z' })
  ];
  for (const order of [[0, 1, 2], [2, 1, 0], [1, 0, 2], [1, 2, 0]]) {
    assert.deepEqual(names(sortCompanies(order.map((i) => mixed[i]), { key: 'jobs', dir: 'desc' })), ['A', 'B', 'C']);
  }
});

test('an unknown sort key behaves like the default', () => {
  assert.deepEqual(names(sortCompanies(list, { key: 'nonsense', dir: 'asc' })), names(sortCompanies(list, { key: 'registered', dir: 'asc' })));
});

test('sorting an empty list is fine', () => {
  assert.deepEqual(sortCompanies([], { key: 'name', dir: 'asc' }), []);
});

test('the status tab filters by verification status', () => {
  assert.deepEqual(names(filterCompanies(list, { tab: 'APPROVED' })), ['Alpha', 'Echo']);
  assert.deepEqual(names(filterCompanies(list, { tab: 'PENDING' })), ['bravo']);
  assert.equal(filterCompanies(list, { tab: 'all' }).length, 5);
  assert.equal(filterCompanies(list, { tab: 'bogus' }).length, 5);
});

test('the jobs filter keeps companies with or without jobs', () => {
  assert.deepEqual(names(filterCompanies(list, { jobs: 'with' })), ['Alpha', 'bravo', 'Delta']);
  assert.deepEqual(names(filterCompanies(list, { jobs: 'none' })), ['Charlie', 'Echo']);
});

test('the submitted filter keeps companies that did or did not send documents', () => {
  assert.deepEqual(names(filterCompanies(list, { submitted: 'yes' })), ['Alpha', 'bravo', 'Echo']);
  assert.deepEqual(names(filterCompanies(list, { submitted: 'no' })), ['Charlie', 'Delta']);
});

test('search looks at company, email, recruiter, industry and city, and filters combine', () => {
  assert.deepEqual(names(filterCompanies(list, { query: 'mumbai' })), ['bravo']);
  assert.deepEqual(names(filterCompanies(list, { query: 'EDTECH' })), ['bravo']);
  assert.deepEqual(names(filterCompanies(list, { query: 'zed' })), ['Alpha']);
  assert.deepEqual(names(filterCompanies(list, { query: 'charlie@' })), ['Charlie']);
  assert.deepEqual(names(filterCompanies(list, { tab: 'APPROVED', jobs: 'with' })), ['Alpha']);
  assert.deepEqual(names(filterCompanies(list, { tab: 'APPROVED', jobs: 'with', submitted: 'no' })), []);
});

test('describeSort names every order in words', () => {
  assert.equal(describeSort(DEFAULT_SORT), 'newest registered first');
  assert.equal(describeSort({ key: 'name', dir: 'desc' }), 'company Z → A');
  assert.equal(describeSort({ key: 'jobs', dir: 'asc' }), 'fewest jobs first');
  assert.equal(describeSort({ key: 'weird', dir: 'asc' }), 'newest registered first');
});

test('isDefaultView is false as soon as anything is changed', () => {
  const base = { sort: DEFAULT_SORT, filters: { jobs: 'all', submitted: 'all' }, tab: 'all' };
  assert.equal(isDefaultView(base), true);
  assert.equal(isDefaultView({ ...base, sort: { key: 'name', dir: 'asc' } }), false);
  assert.equal(isDefaultView({ ...base, sort: { key: 'registered', dir: 'asc' } }), false);
  assert.equal(isDefaultView({ ...base, filters: { jobs: 'with', submitted: 'all' } }), false);
  assert.equal(isDefaultView({ ...base, filters: { jobs: 'all', submitted: 'no' } }), false);
  assert.equal(isDefaultView({ ...base, tab: 'PENDING' }), false);
});
