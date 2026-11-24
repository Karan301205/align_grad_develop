// Phase 1 security fixes (ISSUES A1, A3, A6, U1, U2, S1/G1, S2/G3) on the in-memory test DB.
// Google is never called (fetch is replaced) and S3 is never touched (deleteObject is replaced).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.AWS_REGION = 'test-region-1';

const test = require('node:test');
const assert = require('node:assert');
const env = require('../../src/config/env');
const { prisma } = require('../../src/infrastructure/database');
const s3 = require('../../src/infrastructure/storage/s3');
const { googleTokenProblem } = require('../../src/modules/auth/googleToken');
const authController = require('../../src/modules/auth/auth.controller');
const { isOwnedKey, keyFromPublicUrl } = require('../../src/modules/uploads/ownership');
const uploadController = require('../../src/modules/uploads/upload.controller');
const { deleteS3ObjectFromUrl } = require('../../src/modules/uploads/fileCleanup.service');
const recruiter = require('../../src/modules/recruiters/recruiter.controller');
const { updateCompanySchema } = require('../../src/modules/recruiters/recruiterCompany.validator');
const student = require('../../src/modules/students/student.controller');

const deleted = [];
s3.deleteObject = async (key) => { deleted.push(key); };

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

let seq = 0;
async function makeRecruiter() {
  seq += 1;
  const user = await prisma.user.create({ data: { email: `sec${seq}@acme.example`, password: 'x', role: 'RECRUITER' } });
  const company = await prisma.company.create({
    data: {
      userId: user.id, name: 'Acme', photos: [], verificationStatus: 'APPROVED', verified: true,
      officialEmail: 'kyc@acme.example', docUrl: 'https://test-bucket.s3.amazonaws.com/docs/x/cin.pdf',
      verificationDocs: [{ docType: 'CIN', docUrl: 'https://test-bucket.s3.amazonaws.com/docs/x/cin.pdf' }]
    }
  });
  return { user: { id: user.id, role: 'RECRUITER', email: user.email }, company };
}

async function makeCandidate(name) {
  seq += 1;
  const user = await prisma.user.create({ data: { email: `cand${seq}@x.example`, password: 'x', role: 'STUDENT' } });
  const profile = await prisma.profile.create({
    data: { userId: user.id, name, email: user.email, phone: '9999999999', dob: '2000-01-01', gender: 'F', nationality: 'IN', skills: [] }
  });
  return { user: { id: user.id, role: 'STUDENT', email: user.email }, profile };
}

const QUESTION = { id: 'q1', type: 'MCQ', question: 'Pick one', options: ['A', 'B'], correctAnswer: 'B' };

// ---- A1: Google sign-in --------------------------------------------------------------

const GOOD_TOKEN = {
  iss: 'https://accounts.google.com', aud: 'our-client-id', email_verified: 'true',
  exp: String(Math.floor(Date.now() / 1000) + 600), email: 'a@example.com'
};

test('Google tokens must be from Google, for this app, verified and unexpired', () => {
  assert.strictEqual(googleTokenProblem(GOOD_TOKEN, 'our-client-id'), null);
  assert.match(googleTokenProblem({ ...GOOD_TOKEN, aud: 'someone-else' }, 'our-client-id'), /different app/);
  assert.match(googleTokenProblem({ ...GOOD_TOKEN, iss: 'evil.example' }, 'our-client-id'), /not issued by Google/);
  assert.match(googleTokenProblem({ ...GOOD_TOKEN, email_verified: 'false' }, 'our-client-id'), /not verified/);
  assert.match(googleTokenProblem({ ...GOOD_TOKEN, exp: '1' }, 'our-client-id'), /expired/);
  assert.match(googleTokenProblem(GOOD_TOKEN, ''), /not configured/);
});

test('Google sign-in refuses a token issued to another app, unknown roles, and a missing client ID', async () => {
  const realFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ ...GOOD_TOKEN, aud: 'someone-else' }) });
  try {
    env.GOOGLE_CLIENT_ID = 'our-client-id';
    const other = fakeRes();
    await authController.googleAuth({ body: { credential: 'tok', role: 'STUDENT' } }, other);
    assert.strictEqual(other.statusCode, 401);
    assert.strictEqual(await prisma.user.findUnique({ where: { email: 'a@example.com' } }), null, 'no account created');

    const admin = fakeRes();
    await authController.googleAuth({ body: { credential: 'tok', role: 'ADMIN' } }, admin);
    assert.strictEqual(admin.statusCode, 400);

    env.GOOGLE_CLIENT_ID = '';
    const unset = fakeRes();
    await authController.googleAuth({ body: { credential: 'tok', role: 'STUDENT' } }, unset);
    assert.strictEqual(unset.statusCode, 503);
  } finally {
    global.fetch = realFetch;
    env.GOOGLE_CLIENT_ID = '';
  }
});

// ---- U1, U2: uploads and cleanup -----------------------------------------------------

test('upload keys must be in one of the caller\'s own folders', () => {
  assert.strictEqual(isOwnedKey('images/u1/pic.png', ['u1']), true);
  assert.strictEqual(isOwnedKey('videos/p1/intro.mp4', ['u1', 'p1']), true, 'student video under the profile id');
  assert.strictEqual(isOwnedKey('images/u2/pic.png', ['u1']), false);
  assert.strictEqual(isOwnedKey('images/u1/../u2/pic.png', ['u1']), false);
  assert.strictEqual(isOwnedKey('courses/u1/video.mp4', ['u1']), false, 'not an upload folder');
  assert.strictEqual(isOwnedKey('images/u1/', ['u1']), false);
  assert.strictEqual(keyFromPublicUrl('https://b.s3.region.amazonaws.com/images/u1/a.png'), 'images/u1/a.png');
  assert.strictEqual(keyFromPublicUrl('https://elsewhere.example/a.png'), null);
});

test('PUT /upload/secure-put refuses another user\'s folder before reading the file', async () => {
  const { user } = await makeRecruiter();
  const put = async (key) => {
    const res = fakeRes();
    await uploadController.securePut({ user, query: { fileType: 'image', key, contentType: 'image/png' }, body: Buffer.alloc(0) }, res);
    return res;
  };
  assert.strictEqual((await put('images/someone-else/pic.png')).statusCode, 403);
  // Own folder passes the ownership check and reaches the (empty) file check.
  const own = await put(`images/${user.id}/pic.png`);
  assert.strictEqual(own.statusCode, 400);
  assert.match(own.body.error, /Empty file/);
});

test('cleanup only deletes files owned by the account making the change', async () => {
  deleted.length = 0;
  await deleteS3ObjectFromUrl('https://b.s3.amazonaws.com/images/victim/logo.png', 'logo', ['me']);
  assert.deepStrictEqual(deleted, []);
  await deleteS3ObjectFromUrl('https://b.s3.amazonaws.com/images/me/logo.png', 'logo', ['me']);
  assert.deepStrictEqual(deleted, ['images/me/logo.png']);
});

// ---- A6: the company form can't set office photos (that bypassed the ownership check) ----

test('PUT /recruiter/company drops `photos` and other non-profile fields', () => {
  const parsed = updateCompanySchema.body.parse({
    name: 'Acme', photos: ['https://evil.example/x.png'], verified: true, jobPostingQuota: 999, verificationStatus: 'APPROVED'
  });
  assert.deepStrictEqual(parsed, { name: 'Acme' });
});

// ---- A3: candidate contact details only for applicants -------------------------------

test('recruiters see contact details only for candidates who applied to their company', async () => {
  const { user, company } = await makeRecruiter();
  const applicant = await makeCandidate('Applicant');
  const stranger = await makeCandidate('Stranger');
  const job = await prisma.job.create({ data: { companyId: company.id, title: 'Dev', description: 'x', requirements: [] } });
  await prisma.application.create({ data: { jobId: job.id, studentId: applicant.profile.id } });

  const res = fakeRes();
  await recruiter.getCandidates({ user }, res);
  const byName = Object.fromEntries(res.body.map((p) => [p.name, p]));
  assert.strictEqual(byName.Applicant.phone, '9999999999');
  assert.strictEqual(byName.Applicant.email, applicant.user.email);
  for (const field of ['phone', 'dob', 'email', 'nationality', 'gender']) {
    assert.ok(!(field in byName.Stranger), `${field} hidden`);
  }
  assert.strictEqual(byName.Stranger.name, 'Stranger', 'the rest stays');
});

// ---- S2/G3 and S1/G1: public company page and answer keys -------------------------------

test('the company page hides verification paperwork and answer keys from other people', async () => {
  const { user, company } = await makeRecruiter();
  await prisma.job.create({ data: { companyId: company.id, title: 'Dev', description: 'x', requirements: [], screeningQuestions: [QUESTION] } });
  const viewer = await makeCandidate('Viewer');

  const asViewer = fakeRes();
  await recruiter.getCompanyById({ user: viewer.user, params: { companyId: company.id } }, asViewer);
  assert.strictEqual(asViewer.statusCode, 200);
  for (const field of ['verificationDocs', 'docUrl', 'officialEmail']) {
    assert.ok(!(field in asViewer.body), `${field} hidden`);
  }
  assert.ok(!JSON.stringify(asViewer.body).includes('correctAnswer'), 'no answer key');

  const asOwner = fakeRes();
  await recruiter.getCompanyById({ user, params: { companyId: company.id } }, asOwner);
  assert.strictEqual(asOwner.body.officialEmail, 'kyc@acme.example');
  assert.strictEqual(asOwner.body.verificationDocs.length, 1);
});

test('the public job page never includes the answer key', async () => {
  const { company } = await makeRecruiter();
  const job = await prisma.job.create({
    data: { companyId: company.id, title: 'Dev', description: 'x', requirements: [], screeningQuestions: [QUESTION], expiresAt: new Date(Date.now() + 86400000) }
  });
  const res = fakeRes();
  await student.getPublicJobBrief({ params: { jobId: job.id } }, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.screeningQuestions[0].question, 'Pick one');
  assert.ok(!JSON.stringify(res.body).includes('correctAnswer'));
});
