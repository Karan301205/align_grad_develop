// Candidate-facing job and application responses carry only the public company
// fields (ISSUES S2) and never the MCQ right/wrong marks. Runs on the in-memory mock DB.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/students/student.controller');

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

const PRIVATE_COMPANY_FIELDS = ['verificationDocs', 'docUrl', 'officialEmail', 'userId', 'jobPostingQuota', 'verificationNote', 'user'];

async function seed() {
  const studentUserId = 'beef00000000000000000001';
  const profile = await prisma.profile.create({ data: { userId: studentUserId, name: 'Test Candidate', skills: [{ name: 'SQL', rating: 8, verifiedRating: 8 }] } });
  const company = await prisma.company.create({
    data: {
      userId: 'beef00000000000000000002',
      name: 'Acme Analytics',
      logoUrl: 'https://example.com/logo.png',
      verified: true,
      officialEmail: 'hr@acme.example',
      docUrl: 'https://example.com/gst.pdf',
      verificationDocs: [{ docType: 'GST', docUrl: 'https://example.com/gst.pdf' }],
      jobPostingQuota: 5
    }
  });
  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Data Analyst',
      description: 'Reports',
      status: 'ACTIVE',
      requirements: [{ skillName: 'SQL', minRating: 6 }],
      screeningQuestions: [{ id: 'q1', type: 'MCQ', question: 'Which clause filters groups?', options: ['WHERE', 'HAVING'], correctAnswer: 'HAVING' }]
    }
  });
  await prisma.application.create({
    data: {
      studentId: profile.id,
      jobId: job.id,
      status: 'APPLIED',
      roundStatuses: [{ roundNumber: 1, name: 'HR', status: 'PENDING', feedback: '' }],
      answers: [{ questionId: 'q1', questionText: 'Which clause filters groups?', type: 'MCQ', answer: 'HAVING', isCorrect: true }]
    }
  });
  return { studentUserId, job };
}

test('runs against the mock database', () => {
  assert.strictEqual(isMock(), true);
});

test('applications carry the public company only and no answer marks', async () => {
  const { studentUserId } = await seed();
  const res = fakeRes();
  await controller.getStudentApplications({ user: { id: studentUserId, role: 'STUDENT' } }, res);
  assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
  assert.strictEqual(res.body.length, 1);

  const [app] = res.body;
  assert.deepStrictEqual(Object.keys(app.job.company).sort(), ['id', 'logoUrl', 'name', 'verified']);
  for (const field of PRIVATE_COMPANY_FIELDS) assert.strictEqual(field in app.job.company, false, field);
  assert.strictEqual(app.job.companyName, 'Acme Analytics');
  assert.strictEqual(app.job.screeningQuestions[0].correctAnswer, undefined);
  assert.strictEqual(app.answers[0].answer, 'HAVING');
  assert.strictEqual('isCorrect' in app.answers[0], false);
});

test('the public job brief carries the public company only', async () => {
  const { job } = await seed();
  const res = fakeRes();
  await controller.getPublicJobBrief({ params: { jobId: job.id } }, res);
  assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
  assert.deepStrictEqual(Object.keys(res.body.company).sort(), ['id', 'logoUrl', 'name', 'verified']);
  assert.strictEqual(res.body.company.verified, true);
});
