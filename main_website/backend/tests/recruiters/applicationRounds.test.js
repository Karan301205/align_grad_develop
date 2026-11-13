// PUT /recruiter/applications/:id/rounds: only the company that posted the job may
// move its applicants (ISSUES A4), and a status alone is enough for applications
// without stored rounds. Runs on the in-memory mock DB.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/recruiters/recruiter.controller');
const { updateApplicationRoundsSchema } = require('../../src/modules/recruiters/recruiter.validator');

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

let seq = 0;
async function makeRecruiterWithJob() {
  seq += 1;
  const userId = `${'ab12'.padEnd(18, '0')}${String(seq).padStart(6, '0')}`;
  const company = await prisma.company.create({
    data: { userId, name: `Company ${seq}`, verified: true, verificationStatus: 'APPROVED', photos: [], jobPostingQuota: 5 }
  });
  const job = await prisma.job.create({
    data: { companyId: company.id, title: `Job ${seq}`, description: 'A job description.', requirements: [], selectionProcess: [], activeDays: 30 }
  });
  return { user: { id: userId, role: 'RECRUITER', email: `r${seq}@example.com` }, company, job };
}

const ROUNDS = [
  { roundNumber: 1, name: 'Resume Screening', status: 'PENDING', feedback: '' },
  { roundNumber: 2, name: 'Technical Interview', status: 'PENDING', feedback: '' }
];

async function makeApplication(jobId, fields = {}) {
  return prisma.application.create({
    data: { studentId: 'feed00000000000000000001', jobId, status: 'APPLIED', roundStatuses: ROUNDS, ...fields }
  });
}

async function callUpdate(user, applicationId, body) {
  const res = fakeRes();
  await controller.updateApplicationRounds({ user, params: { applicationId }, body }, res);
  return res;
}

test('runs against the mock database', () => {
  assert.strictEqual(isMock(), true);
});

test('the posting company can shortlist and add round feedback', async () => {
  const { user, job } = await makeRecruiterWithJob();
  const app = await makeApplication(job.id);
  const rounds = ROUNDS.map((round, i) => (i === 0 ? { ...round, status: 'CLEARED', feedback: 'Good resume' } : round));

  const res = await callUpdate(user, app.id, { status: 'SHORTLISTED', roundStatuses: rounds });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.status, 'SHORTLISTED');
  assert.strictEqual(res.body.roundStatuses[0].feedback, 'Good resume');
});

test('another company cannot change the application (A4)', async () => {
  const owner = await makeRecruiterWithJob();
  const rival = await makeRecruiterWithJob();
  const app = await makeApplication(owner.job.id);

  const res = await callUpdate(rival.user, app.id, { status: 'REJECTED', roundStatuses: ROUNDS });
  assert.strictEqual(res.statusCode, 403);
  const stored = await prisma.application.findUnique({ where: { id: app.id } });
  assert.strictEqual(stored.status, 'APPLIED');
});

test('a rejected round rejects the application; all rounds cleared marks it selected', async () => {
  const { user, job } = await makeRecruiterWithJob();
  const app = await makeApplication(job.id);

  const rejected = await callUpdate(user, app.id, { status: 'SHORTLISTED', roundStatuses: ROUNDS.map((r, i) => (i === 1 ? { ...r, status: 'REJECTED' } : r)) });
  assert.strictEqual(rejected.body.status, 'REJECTED');

  const cleared = await callUpdate(user, app.id, { status: 'IN_PROGRESS', roundStatuses: ROUNDS.map((r) => ({ ...r, status: 'CLEARED' })) });
  assert.strictEqual(cleared.body.status, 'SELECTED');
});

test('an application without stored rounds can still be moved with a status alone', async () => {
  const { user, job } = await makeRecruiterWithJob();
  const app = await makeApplication(job.id, { roundStatuses: [] });
  const body = updateApplicationRoundsSchema.body.parse({ status: 'SHORTLISTED' });

  const res = await callUpdate(user, app.id, body);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.status, 'SHORTLISTED');
  assert.deepStrictEqual(res.body.roundStatuses, []);
});

test('the validator needs a status or at least one round', () => {
  const result = updateApplicationRoundsSchema.body.safeParse({ roundStatuses: [] });
  assert.strictEqual(result.success, false);
  assert.match(result.error.issues[0].message, /Choose a status or update at least one round/);
  assert.strictEqual(updateApplicationRoundsSchema.body.safeParse({ roundStatuses: ROUNDS }).success, true);
  assert.strictEqual(updateApplicationRoundsSchema.body.safeParse({ status: 'HIRED' }).success, true);
});

test('unknown applications return 404', async () => {
  const { user } = await makeRecruiterWithJob();
  const res = await callUpdate(user, 'ffffffffffffffffffffffff', { status: 'SHORTLISTED' });
  assert.strictEqual(res.statusCode, 404);
});
