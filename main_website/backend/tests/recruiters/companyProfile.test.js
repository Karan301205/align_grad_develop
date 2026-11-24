// Company profile endpoints: role guard, job quota, submission completeness and
// the office gallery. Runs entirely against the in-memory test DB, with S3 deletes stubbed,
// so nothing reaches a real database or bucket.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
// A placeholder bucket so file URLs can be built; S3 deletes are stubbed below, so
// nothing is sent to AWS.
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.AWS_REGION = 'test-region-1';

const test = require('node:test');
const assert = require('node:assert');
const {
  getSubmissionProblems,
  buildJobQuota,
  isOwnUpload,
  MAX_OFFICE_PHOTOS
} = require('../../src/modules/recruiters/companyProfile');
const { requireRecruiter } = require('../../src/modules/recruiters/companyVerification');
const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/recruiters/recruiter.controller');
const s3 = require('../../src/infrastructure/storage/s3');
const { getPublicUrl } = s3;

s3.deleteObject = async () => {};

const COMPLETE_PROFILE = {
  name: 'Acme Technologies',
  industry: 'Software & Information Technology',
  companySize: '11-50 employees',
  location: 'Bengaluru, Karnataka',
  website: 'https://acme.example',
  description: 'We build tools for teams.',
  recruiterName: 'Riya Sharma',
  recruiterDesignation: 'Talent Lead',
  officialEmail: 'riya.acme@gmail.com'
};
const TWO_DOCS = [
  { docType: 'CIN', docUrl: 'https://files.example/cin.pdf', fileName: 'cin.pdf' },
  { docType: 'PAN Card', docUrl: 'https://files.example/pan.pdf', fileName: 'pan.pdf' }
];

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

let userSeq = 0;
async function makeCompany(fields = {}) {
  userSeq += 1;
  const userId = `${'c0ffee'.padEnd(18, '0')}${String(userSeq).padStart(6, '0')}`;
  const company = await prisma.company.create({
    data: { userId, name: 'Acme', verified: false, verificationStatus: 'NOT_SUBMITTED', photos: [], jobPostingQuota: 1, ...fields }
  });
  return { userId, company, user: { id: userId, role: 'RECRUITER', email: `r${userSeq}@acme.example` } };
}

test('runs against the mock database', () => {
  assert.strictEqual(isMock(), true);
});

test('getSubmissionProblems accepts a complete profile with two distinct documents', () => {
  assert.deepStrictEqual(getSubmissionProblems(COMPLETE_PROFILE, TWO_DOCS), []);
});

test('getSubmissionProblems lists missing fields and document problems', () => {
  const problems = getSubmissionProblems({ ...COMPLETE_PROFILE, industry: '  ', officialEmail: null }, [TWO_DOCS[0]]);
  assert.match(problems[0], /Industry, Official email address/);
  assert.match(problems[1], /exactly 2 legal documents \(1 provided\)/);

  assert.ok(getSubmissionProblems(COMPLETE_PROFILE, [TWO_DOCS[0], TWO_DOCS[0]]).some((p) => /different document type/.test(p)));
  assert.ok(getSubmissionProblems(COMPLETE_PROFILE, [TWO_DOCS[0], { ...TWO_DOCS[1], docType: 'Selfie' }]).some((p) => /unsupported/.test(p)));
  assert.ok(getSubmissionProblems(COMPLETE_PROFILE, undefined).some((p) => /0 provided/.test(p)));
});

test('buildJobQuota reports used and remaining posts', () => {
  assert.deepStrictEqual(buildJobQuota(1, 0), { total: 1, used: 0, remaining: 1 });
  assert.deepStrictEqual(buildJobQuota(6, 7), { total: 6, used: 7, remaining: 0 });
  assert.deepStrictEqual(buildJobQuota(undefined, undefined), { total: 1, used: 0, remaining: 1 });
});

test('isOwnUpload only matches the caller\'s upload folders', () => {
  const prefixes = ['https://b.s3.r.amazonaws.com/docs/u1/', 'https://b.s3.r.amazonaws.com/images/u1/'];
  assert.strictEqual(isOwnUpload('https://b.s3.r.amazonaws.com/docs/u1/doc_1.png', prefixes), true);
  assert.strictEqual(isOwnUpload('https://b.s3.r.amazonaws.com/docs/u2/doc_1.png', prefixes), false);
  assert.strictEqual(isOwnUpload(null, prefixes), false);
});

test('requireRecruiter blocks students and lets recruiters through', () => {
  const res = fakeRes();
  let called = false;
  requireRecruiter({ user: { id: 'x', role: 'STUDENT' } }, res, () => { called = true; });
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(called, false);

  requireRecruiter({ user: { id: 'y', role: 'RECRUITER' } }, fakeRes(), () => { called = true; });
  assert.strictEqual(called, true);
});

test('GET /recruiter/company includes the job quota, excluding gigs', async () => {
  const { user } = await makeCompany({ jobPostingQuota: 6 });
  // Credits are counted when a job is posted, so post through the handler.
  for (const opportunityType of ['JOB', 'GIG']) {
    const posted = fakeRes();
    await controller.postJob({ user, body: { title: `${opportunityType} post`, description: 'Details', requirements: [], opportunityType } }, posted);
    assert.strictEqual(posted.statusCode, 201);
  }

  const res = fakeRes();
  await controller.getCompany({ user }, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.jobQuota, { total: 6, used: 1, remaining: 5 });
  assert.strictEqual(res.body.verificationStatus, 'NOT_SUBMITTED');
});

test('POST /recruiter/verify refuses an incomplete profile and keeps it editable', async () => {
  const { user, userId } = await makeCompany({ ...COMPLETE_PROFILE, description: '' });
  const res = fakeRes();
  await controller.verifyCompany({ user, body: { verificationDocs: TWO_DOCS } }, res);
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.error, /Company description/);
  const saved = await prisma.company.findUnique({ where: { userId } });
  assert.strictEqual(saved.verificationStatus, 'NOT_SUBMITTED');
});

test('POST /recruiter/verify refuses a single document', async () => {
  const { user } = await makeCompany(COMPLETE_PROFILE);
  const res = fakeRes();
  await controller.verifyCompany({ user, body: { verificationDocs: [TWO_DOCS[0]] } }, res);
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.error, /exactly 2/);
});

test('POST /recruiter/verify queues a complete profile for review', async () => {
  const { user } = await makeCompany(COMPLETE_PROFILE);
  const res = fakeRes();
  await controller.verifyCompany({ user, body: { docUrl: TWO_DOCS[0].docUrl, verificationDocs: TWO_DOCS } }, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.verificationStatus, 'PENDING');
  assert.strictEqual(res.body.verificationDocs.length, 2);
});

test('PUT /recruiter/company/photos works while the profile is under review', async () => {
  const { user, userId } = await makeCompany({ ...COMPLETE_PROFILE, verificationStatus: 'PENDING' });
  const own = getPublicUrl(`docs/${userId}/doc_1.jpg`);
  const res = fakeRes();
  await controller.updateCompanyPhotos({ user, body: { photos: [own] } }, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.photos, [own]);

  // Removing it again is allowed too (S3 is off in tests, so nothing is deleted remotely).
  const removeRes = fakeRes();
  await controller.updateCompanyPhotos({ user, body: { photos: [] } }, removeRes);
  assert.deepStrictEqual(removeRes.body.photos, []);
});

test('PUT /recruiter/company/photos rejects files the recruiter did not upload', async () => {
  const { user } = await makeCompany();
  const res = fakeRes();
  await controller.updateCompanyPhotos({ user, body: { photos: [getPublicUrl('docs/someone-else/doc_1.jpg')] } }, res);
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.error, /uploaded from this page/);
});

test(`PUT /recruiter/company/photos caps the gallery at ${MAX_OFFICE_PHOTOS} photos`, async () => {
  const { user, userId } = await makeCompany();
  const photos = Array.from({ length: MAX_OFFICE_PHOTOS + 1 }, (_, i) => getPublicUrl(`docs/${userId}/doc_${i}.jpg`));
  const res = fakeRes();
  await controller.updateCompanyPhotos({ user, body: { photos } }, res);
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.error, /up to 10/);
});
