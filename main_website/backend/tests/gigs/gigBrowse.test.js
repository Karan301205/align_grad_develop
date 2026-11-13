// What candidates get from the gig list, "my gigs" and gig pages: public gig data,
// their own pitch and work only, the skill bars they are below (the rule the pitch
// endpoint enforces), and no company documents or answer keys. Runs on the test store.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/gigs/gig.controller');
const { applyGigSchema } = require('../../src/modules/gigs/gig.validator');

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}
const call = async (handler, req) => {
  const res = fakeRes();
  await handler(req, res);
  return res;
};

const recruiter = { id: 'ab0000000000000000000001', role: 'RECRUITER' };
const ready = { id: 'ab0000000000000000000002', role: 'STUDENT' }; // meets every bar
const short = { id: 'ab0000000000000000000003', role: 'STUDENT' }; // below Excel
const complete = { username: 'u', bio: 'Bio text', gender: 'Female', email: 'x@example.com', dob: '2004-01-01', phone: '+91 9876543210', introVideoUrl: 'https://cdn.example.com/v.mp4' };
let gig;

test('setup', async () => {
  assert.strictEqual(isMock(), true);
  await prisma.company.create({
    data: { userId: recruiter.id, name: 'Kalpa Retail', verified: true, officialEmail: 'hr@kalpa.example', docUrl: 'https://example.com/gst.pdf', verificationDocs: [{ docType: 'GST', docUrl: 'https://example.com/gst.pdf' }], jobPostingQuota: 4 }
  });
  await prisma.profile.create({ data: { userId: ready.id, name: 'Ready', ...complete, skills: [{ name: 'Python', rating: 7, verifiedRating: 7 }, { name: 'Excel', rating: 6, verifiedRating: 6 }] } });
  await prisma.profile.create({ data: { userId: short.id, name: 'Short', ...complete, skills: [{ name: 'Python', rating: 8, verifiedRating: 8 }, { name: 'Excel', rating: 3 }] } });
  gig = await prisma.gig.create({
    data: {
      title: 'Merge monthly Excel files', description: 'Combine 12 store files', skills: ['Python', 'Excel'], ownerId: recruiter.id, status: 'OPEN', hiredCandidateIds: [], budget: 3000, deliveryTime: '5 days',
      requirements: [{ skillName: 'Python', minRating: 6 }, { skillName: 'Excel', minRating: 5 }],
      screeningQuestions: [{ id: 'q1', type: 'MCQ', question: 'Which library reads Excel?', options: ['pandas', 'flask'], correctAnswer: 'pandas', required: true }]
    }
  });
});

test('a candidate pitches; a second request at the same moment is refused, not duplicated', async () => {
  const body = { message: 'I have merged sheets with pandas before.', attachments: ['https://github.com/ready/merge'], answers: [{ questionId: 'q1', questionText: 'Which library reads Excel?', type: 'MCQ', answer: 'pandas' }] };
  const [first, second] = await Promise.all([
    call(controller.applyToGig, { user: ready, params: { gigId: gig.id }, body }),
    call(controller.applyToGig, { user: ready, params: { gigId: gig.id }, body })
  ]);
  assert.deepStrictEqual([first.statusCode, second.statusCode].sort(), [201, 409]);
  assert.strictEqual('isCorrect' in (first.statusCode === 201 ? first.body : second.body).answers[0], false);
  const pitches = await prisma.gigApplicant.findMany({ where: { gigId: gig.id } });
  assert.strictEqual(pitches.length, 1);
});

test('the pitch endpoint refuses a candidate below a skill bar', async () => {
  const res = await call(controller.applyToGig, { user: short, params: { gigId: gig.id }, body: { message: 'Pitch' } });
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.error, /Excel score is 3; this gig needs 5/);
});

test('the gig list is public data plus the candidate’s own standing', async () => {
  const res = await call(controller.getGigs, { user: short, query: {} });
  assert.strictEqual(res.statusCode, 200);
  const [item] = res.body;
  assert.deepStrictEqual(Object.keys(item.company).sort(), ['id', 'logoUrl', 'name', 'verified']);
  assert.strictEqual(item.screeningQuestions[0].correctAnswer, undefined);
  for (const field of ['applicants', 'hiredCandidateIds', 'selectedCandidateId', 'ownerId', 'typingUserId']) assert.strictEqual(field in item, false, field);
  assert.strictEqual(item.pitchCount, 1);
  assert.strictEqual(item.hasApplied, false);
  assert.deepStrictEqual(item.missingRequirements.map(m => [m.skillName, m.currentRating, m.requiredRating]), [['Excel', 3, 5]]);

  const mine = await call(controller.getGigs, { user: ready, query: {} });
  assert.strictEqual(mine.body[0].hasApplied, true);
  assert.deepStrictEqual(mine.body[0].missingRequirements, []);
});

test('my gigs shows only the candidate’s own pitch and work', async () => {
  const other = await call(controller.getMyGigs, { user: short });
  assert.deepStrictEqual(other.body, [], 'a candidate who never pitched sees nothing');

  const res = await call(controller.getMyGigs, { user: ready });
  assert.strictEqual(res.body.length, 1);
  const [item] = res.body;
  assert.strictEqual(item.myPitch.message, 'I have merged sheets with pandas before.');
  assert.strictEqual('isCorrect' in item.myPitch.answers[0], false);
  assert.strictEqual('applicants' in item, false);
  assert.strictEqual(item.isHired, false);
  assert.strictEqual(item.mySubmission, null);
  assert.deepStrictEqual(Object.keys(item.company).sort(), ['id', 'logoUrl', 'name', 'verified']);
});

test('every hired freelancer can rate the company once the gig is complete', async () => {
  const second = { id: 'ab0000000000000000000004', role: 'STUDENT' };
  await prisma.gigApplicant.create({ data: { gigId: gig.id, candidateId: second.id, message: 'Me too', answers: [] } });
  await call(controller.hireCandidate, { user: recruiter, params: { gigId: gig.id }, body: { candidateId: ready.id } });
  await call(controller.hireCandidate, { user: recruiter, params: { gigId: gig.id }, body: { candidateId: second.id } });
  await prisma.gig.update({ where: { id: gig.id }, data: { status: 'COMPLETED' } });

  const first = await call(controller.reviewGig, { user: ready, params: { gigId: gig.id }, body: { rating: 5, review: 'Clear brief, quick replies.' } });
  assert.strictEqual(first.statusCode, 201, JSON.stringify(first.body));
  assert.strictEqual(first.body.revieweeId, recruiter.id);
  const again = await call(controller.reviewGig, { user: ready, params: { gigId: gig.id }, body: { rating: 4, review: 'Again' } });
  assert.strictEqual(again.statusCode, 400);

  const view = await call(controller.getGigDetails, { user: ready, params: { gigId: gig.id } });
  assert.strictEqual(view.body.myReview.rating, 5);
});

test('pitch links must be web addresses', () => {
  assert.strictEqual(applyGigSchema.body.safeParse({ message: 'x', attachments: ['javascript:alert(1)'] }).success, false);
  assert.strictEqual(applyGigSchema.body.safeParse({ message: 'x', attachments: ['https://github.com/a/b'] }).success, true);
});
