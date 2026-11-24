// Job lifecycle (modules/jobs/jobLifecycle.service.js) and job credits (Company.jobsPosted):
// recruiter-chosen listing length, expiry, credits never coming back, and the retention pass
// that slims and later deletes old jobs. Runs on the in-memory test DB.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { prisma } = require('../../src/infrastructure/database');
const recruiter = require('../../src/modules/recruiters/recruiter.controller');
const student = require('../../src/modules/students/student.controller');
const { expiryFrom, isJobOpen, runJobRetention } = require('../../src/modules/jobs/jobLifecycle.service');

const DAY = 24 * 60 * 60 * 1000;

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

let seq = 0;
async function makeRecruiter({ quota = 1 } = {}) {
  seq += 1;
  const user = await prisma.user.create({ data: { email: `life${seq}@acme.example`, password: 'x', role: 'RECRUITER' } });
  const company = await prisma.company.create({ data: { userId: user.id, name: 'Acme', jobPostingQuota: quota, photos: [] } });
  return { user: { id: user.id, role: 'RECRUITER', email: user.email }, company };
}

async function post(user, body = {}) {
  const res = fakeRes();
  await recruiter.postJob({ user, body: { title: 'Backend developer', description: 'Build APIs', requirements: [], ...body } }, res);
  return res;
}

const creditsUsed = async (companyId) => (await prisma.company.findUnique({ where: { id: companyId } })).jobsPosted;

test('a job stays live for the days the recruiter chose', async () => {
  const { user } = await makeRecruiter({ quota: 5 });
  const res = await post(user, { activeDays: 3 });
  assert.strictEqual(res.statusCode, 201);
  const job = res.body;
  assert.strictEqual(job.activeDays, 3);
  assert.strictEqual(new Date(job.expiresAt).getTime() - new Date(job.createdAt).getTime(), 3 * DAY);
  assert.strictEqual(isJobOpen(job, new Date(job.createdAt.getTime() + 2 * DAY)), true);
  assert.strictEqual(isJobOpen(job, new Date(job.createdAt.getTime() + 3 * DAY + 1)), false);
});

test('posting uses a credit for good: deleting the job does not give it back', async () => {
  const { user, company } = await makeRecruiter({ quota: 1 });
  const first = await post(user);
  assert.strictEqual(first.statusCode, 201);
  assert.strictEqual(await creditsUsed(company.id), 1);

  const del = fakeRes();
  await recruiter.deleteJob({ user, params: { jobId: first.body.id } }, del);
  assert.strictEqual(del.statusCode, 200);
  assert.strictEqual(await creditsUsed(company.id), 1, 'still used');

  const second = await post(user);
  assert.strictEqual(second.statusCode, 403);
  assert.strictEqual(second.body.code, 'UPGRADE_REQUIRED');
});

test('two posts at the same moment cannot both use the last credit', async () => {
  const { user, company } = await makeRecruiter({ quota: 1 });
  const results = await Promise.all([post(user), post(user)]);
  assert.deepStrictEqual(results.map((r) => r.statusCode).sort(), [201, 403]);
  assert.strictEqual(await creditsUsed(company.id), 1);
});

test('gigs posted as jobs use no credit', async () => {
  const { user, company } = await makeRecruiter({ quota: 1 });
  assert.strictEqual((await post(user, { opportunityType: 'GIG' })).statusCode, 201);
  assert.strictEqual(await creditsUsed(company.id), 0);
});

test('editing the listing length moves the end date; leaving it out keeps the chosen length', async () => {
  const { user } = await makeRecruiter({ quota: 5 });
  const job = (await post(user, { activeDays: 10 })).body;
  const edit = async (body) => {
    const res = fakeRes();
    await recruiter.updateJob({ user, params: { jobId: job.id }, body: { title: 'Backend developer', description: 'Build APIs', requirements: [], ...body } }, res);
    return res.body;
  };
  const longer = await edit({ activeDays: 20 });
  assert.strictEqual(new Date(longer.expiresAt).getTime(), expiryFrom(job.createdAt, 20).getTime());
  const unchanged = await edit({});
  assert.strictEqual(unchanged.activeDays, 20, 'not reset to 30');
});

test('an expired job is gone from its public page', async () => {
  const { company } = await makeRecruiter();
  const createdAt = new Date(Date.now() - 10 * DAY);
  const expired = await prisma.job.create({
    data: { companyId: company.id, title: 'Old', description: 'x', createdAt, activeDays: 3, expiresAt: expiryFrom(createdAt, 3) }
  });
  const res = fakeRes();
  await student.getPublicJobBrief({ params: { jobId: expired.id } }, res);
  assert.strictEqual(res.statusCode, 404);
});

test('retention slims old jobs, deletes older ones, and keeps a job someone was hired from', async () => {
  const { company } = await makeRecruiter();
  const now = new Date();
  const ended = (daysAgo) => new Date(now.getTime() - daysAgo * DAY);
  const make = (title, expiresAt, extra = {}) => prisma.job.create({
    data: {
      companyId: company.id, title, description: 'Long description', roleResponsibilities: 'Lots',
      requirements: [{ skillName: 'Node', minRating: 5 }], screeningQuestions: [{ id: 'q', question: 'Why?' }],
      expiresAt, ...extra
    }
  });

  const live = await make('Live', new Date(now.getTime() + 5 * DAY));
  const recent = await make('Ended 10 days ago', ended(10));
  const toSlim = await make('Ended 40 days ago', ended(40));
  const toDelete = await make('Ended 400 days ago', ended(400));
  const withHire = await make('Ended 400 days ago, hired', ended(400));
  const lost = await prisma.application.create({ data: { jobId: toDelete.id, studentId: 'p1', status: 'REJECTED' } });
  const hired = await prisma.application.create({ data: { jobId: withHire.id, studentId: 'p2', status: 'SELECTED' } });
  const notHired = await prisma.application.create({ data: { jobId: withHire.id, studentId: 'p3', status: 'APPLIED' } });

  const result = await runJobRetention(prisma, { now, archiveAfterDays: 30, deleteAfterDays: 365 });
  assert.deepStrictEqual(result, { slimmed: 3, deleted: 1, retained: 1 });

  const after = async (job) => prisma.job.findUnique({ where: { id: job.id } });
  assert.strictEqual((await after(live)).description, 'Long description', 'live job untouched');
  assert.strictEqual((await after(recent)).archivedAt, undefined, 'not yet');
  const slim = await after(toSlim);
  assert.strictEqual(slim.description, '');
  assert.deepStrictEqual([slim.roleResponsibilities, slim.requirements, slim.screeningQuestions], [null, [], []]);
  assert.strictEqual(slim.title, 'Ended 40 days ago', 'title stays');

  assert.strictEqual(await after(toDelete), null);
  const kept = await after(withHire);
  assert.ok(kept.retainedAt, 'kept because someone was hired');
  const remaining = (await prisma.application.findMany({ where: { jobId: withHire.id } })).map((a) => a.id);
  assert.deepStrictEqual(remaining, [hired.id]);
  assert.strictEqual((await prisma.application.findUnique({ where: { id: lost.id } })), null);
  assert.strictEqual((await prisma.application.findUnique({ where: { id: notHired.id } })), null);

  // Running again changes nothing.
  assert.deepStrictEqual(await runJobRetention(prisma, { now, archiveAfterDays: 30, deleteAfterDays: 365 }), { slimmed: 0, deleted: 0, retained: 0 });
});

test('the candidate job list is cached, cleared when a recruiter posts, and leaves out expired jobs', async () => {
  const { invalidate } = require('../../src/shared/cache/ttlCache');
  const { user } = await makeRecruiter({ quota: 5 });
  const candidate = await prisma.user.create({ data: { email: `list${seq}@x.example`, password: 'x', role: 'STUDENT' } });
  await prisma.profile.create({ data: { userId: candidate.id, name: 'Lister', skills: [] } });
  const list = async () => {
    const res = fakeRes();
    await student.getJobs({ user: { id: candidate.id, role: 'STUDENT' } }, res);
    assert.strictEqual(res.statusCode, 200);
    return res.body.map((job) => job.title);
  };

  invalidate();
  const before = await list();
  await post(user, { title: 'Posted through the app' });
  assert.ok((await list()).includes('Posted through the app'), 'posting clears the cache');

  const { company } = await makeRecruiter();
  await prisma.job.create({ data: { companyId: company.id, title: 'Written straight to the DB', description: 'x', expiresAt: new Date(Date.now() + DAY) } });
  assert.ok(!(await list()).includes('Written straight to the DB'), 'cached for a moment');
  invalidate('jobs:');
  const after = await list();
  assert.ok(after.includes('Written straight to the DB'));

  await prisma.job.create({ data: { companyId: company.id, title: 'Already over', description: 'x', expiresAt: new Date(Date.now() - DAY) } });
  invalidate('jobs:');
  assert.ok(!(await list()).includes('Already over'));
  assert.ok(after.length > before.length);
});
