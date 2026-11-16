const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeJob } = require('./jobSummary');

const row = {
  id: '6730aa11bb22cc33dd44ee55',
  title: 'Data Analyst',
  description: 'Work with data.',
  companyName: 'Old Name Ltd',
  opportunityType: 'JOB',
  workMode: 'Work from office',
  location: 'Pune',
  stipendFullTime: '25000',
  showSalary: true,
  requirements: [{ skillName: 'SQL', minRating: 4 }],
  createdAt: new Date('2026-11-10T08:30:00.000Z')
};

test('summarizeJob returns the display fields and when the job was posted', () => {
  const summary = summarizeJob(row, { name: 'Acme Corp' });
  assert.equal(summary.id, row.id);
  assert.equal(summary.title, 'Data Analyst');
  assert.equal(summary.companyName, 'Acme Corp');
  assert.equal(summary.location, 'Work from office · Pune');
  assert.equal(summary.jobType, 'Full-time job');
  assert.equal(summary.salaryRange, '₹25,000/month');
  assert.deepEqual(summary.requirements, row.requirements);
  assert.equal(summary.postedAt, row.createdAt);
  // what the API sends is JSON, so the date must survive as an ISO string
  assert.equal(JSON.parse(JSON.stringify(summary)).postedAt, '2026-11-10T08:30:00.000Z');
});

test('the company row wins, then the name stored on the job, then "Not specified"', () => {
  assert.equal(summarizeJob(row, { name: 'Acme Corp' }).companyName, 'Acme Corp');
  assert.equal(summarizeJob(row, undefined).companyName, 'Old Name Ltd');
  assert.equal(summarizeJob({ ...row, companyName: null }, undefined).companyName, 'Not specified');
});

test('a posting without a creation date says so with null, not a made-up date', () => {
  assert.equal(summarizeJob({ ...row, createdAt: null }, undefined).postedAt, null);
  assert.equal(summarizeJob({ ...row, createdAt: undefined }, undefined).postedAt, null);
});

test('missing requirements become an empty list', () => {
  assert.deepEqual(summarizeJob({ ...row, requirements: null }, undefined).requirements, []);
});
