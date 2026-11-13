// Gig chat and hiring rules: private conversations, incremental reads, safe links,
// no "typing" writes, and completion once every hired freelancer's work is accepted.
// Runs on the in-memory test store.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/gigs/gig.controller');
const { sendMessageSchema, getMessagesSchema } = require('../../src/modules/gigs/gig.validator');

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

let seq = 0;
const id = (prefix) => `${prefix}${String(++seq).padStart(24 - prefix.length, '0')}`;
const recruiter = { id: id('aa'), role: 'RECRUITER', email: 'owner@example.com' };
const studentA = { id: id('bb'), role: 'STUDENT', email: 'a@example.com' };
const studentB = { id: id('cc'), role: 'STUDENT', email: 'b@example.com' };
const studentC = { id: id('dd'), role: 'STUDENT', email: 'c@example.com' };

let gig;

test('setup: a gig with three pitches', async () => {
  assert.strictEqual(isMock(), true);
  gig = await prisma.gig.create({
    data: { title: 'Excel dashboard', description: 'Build a dashboard', skills: ['Excel'], requirements: [], budget: 6000, deliveryTime: '7 days', ownerId: recruiter.id, status: 'OPEN', hiredCandidateIds: [] }
  });
  for (const s of [studentA, studentB, studentC]) {
    await prisma.gigApplicant.create({ data: { gigId: gig.id, candidateId: s.id, message: 'Pitch', answers: [] } });
  }
});

test('hiring only works for people who pitched, and only once', async () => {
  const stranger = await call(controller.hireCandidate, { user: recruiter, params: { gigId: gig.id }, body: { candidateId: id('ee') } });
  assert.strictEqual(stranger.statusCode, 400);
  const hired = await call(controller.hireCandidate, { user: recruiter, params: { gigId: gig.id }, body: { candidateId: studentA.id } });
  assert.strictEqual(hired.statusCode, 200);
  assert.strictEqual(hired.body.status, 'IN_PROGRESS');
  const again = await call(controller.hireCandidate, { user: recruiter, params: { gigId: gig.id }, body: { candidateId: studentA.id } });
  assert.strictEqual(again.statusCode, 400);
  const passHired = await call(controller.rejectCandidate, { user: recruiter, params: { gigId: gig.id }, body: { candidateId: studentA.id } });
  assert.strictEqual(passHired.statusCode, 400);
});

test('sending is instant and never touches the gig row', async () => {
  const before = await prisma.gig.findUnique({ where: { id: gig.id } });
  const started = Date.now();
  const res = await call(controller.sendMessage, { user: recruiter, params: { gigId: gig.id }, body: { text: '  Welcome aboard  ' } });
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.text, 'Welcome aboard');
  assert.strictEqual(res.body.receiverId, studentA.id); // the only hired freelancer
  assert.ok(Date.now() - started < 300, 'no artificial delay');
  const after = await prisma.gig.findUnique({ where: { id: gig.id } });
  assert.strictEqual(after.typingUserId, before.typingUserId);
});

test('only the owner and hired freelancers can chat', async () => {
  const b = await call(controller.sendMessage, { user: studentB, params: { gigId: gig.id }, body: { text: 'hi' } });
  assert.strictEqual(b.statusCode, 403);
  const read = await call(controller.getMessages, { user: studentB, params: { gigId: gig.id }, query: {} });
  assert.strictEqual(read.statusCode, 403);
  const a = await call(controller.sendMessage, { user: studentA, params: { gigId: gig.id }, body: { text: 'Thanks!', receiverId: studentB.id } });
  assert.strictEqual(a.statusCode, 201);
  assert.strictEqual(a.body.receiverId, recruiter.id, 'a freelancer always writes to the owner');
});

test('with two hired freelancers, conversations stay private', async () => {
  await call(controller.hireCandidate, { user: recruiter, params: { gigId: gig.id }, body: { candidateId: studentB.id } });
  const noTarget = await call(controller.sendMessage, { user: recruiter, params: { gigId: gig.id }, body: { text: 'Who gets this?' } });
  assert.strictEqual(noTarget.statusCode, 400);
  const notHired = await call(controller.sendMessage, { user: recruiter, params: { gigId: gig.id }, body: { text: 'hi', receiverId: studentC.id } });
  assert.strictEqual(notHired.statusCode, 400);
  const toB = await call(controller.sendMessage, { user: recruiter, params: { gigId: gig.id }, body: { text: 'Private to B', receiverId: studentB.id } });
  assert.strictEqual(toB.statusCode, 201);

  const aView = await call(controller.getMessages, { user: studentA, params: { gigId: gig.id }, query: {} });
  assert.ok(aView.body.messages.length >= 3);
  assert.ok(aView.body.messages.every(m => m.senderId === studentA.id || m.receiverId === studentA.id));
  assert.ok(!aView.body.messages.some(m => m.text === 'Private to B'));

  const ownerWithA = await call(controller.getMessages, { user: recruiter, params: { gigId: gig.id }, query: { with: studentA.id } });
  assert.ok(!ownerWithA.body.messages.some(m => m.text === 'Private to B'));
  const ownerWithC = await call(controller.getMessages, { user: recruiter, params: { gigId: gig.id }, query: { with: studentC.id } });
  assert.strictEqual(ownerWithC.statusCode, 400);

  // Candidates get the public gig and their own standing only: no messages (those
  // come from GET /messages), no other pitches and no list of who was hired.
  const detailsC = await call(controller.getGigDetails, { user: studentC, params: { gigId: gig.id } });
  const detailsA = await call(controller.getGigDetails, { user: studentA, params: { gigId: gig.id } });
  for (const view of [detailsA.body, detailsC.body]) {
    for (const field of ['messages', 'applicants', 'submissions', 'hiredCandidates', 'hiredCandidateIds', 'reviews', 'ownerId']) {
      assert.strictEqual(field in view, false, field);
    }
    assert.strictEqual(view.pitchCount, 3);
    assert.strictEqual(view.myPitch.message, 'Pitch');
  }
  assert.strictEqual(detailsA.body.isHired, true);
  assert.strictEqual(detailsC.body.isHired, false);
  const ownerDetails = await call(controller.getGigDetails, { user: recruiter, params: { gigId: gig.id } });
  assert.strictEqual(ownerDetails.body.applicants.length, 3, 'the owner sees every pitch');
});

test('incremental reads return only newer messages, oldest first', async () => {
  const first = await call(controller.getMessages, { user: studentB, params: { gigId: gig.id }, query: {} });
  const last = first.body.messages[first.body.messages.length - 1];
  await new Promise(r => setTimeout(r, 5));
  await call(controller.sendMessage, { user: studentB, params: { gigId: gig.id }, body: { text: 'New one' } });
  const next = await call(controller.getMessages, { user: studentB, params: { gigId: gig.id }, query: { after: new Date(last.createdAt).toISOString() } });
  const texts = next.body.messages.map(m => m.text);
  assert.ok(texts.includes('New one'));
  assert.ok(texts.indexOf('New one') === texts.length - 1);
  for (let i = 1; i < next.body.messages.length; i++) {
    assert.ok(new Date(next.body.messages[i].createdAt) >= new Date(next.body.messages[i - 1].createdAt));
  }
});

test('older history pages backwards', async () => {
  for (let i = 0; i < 6; i++) {
    await call(controller.sendMessage, { user: studentA, params: { gigId: gig.id }, body: { text: `Bulk ${i}` } });
    await new Promise(r => setTimeout(r, 2));
  }
  const page = await call(controller.getMessages, { user: studentA, params: { gigId: gig.id }, query: { limit: 3 } });
  assert.strictEqual(page.body.messages.length, 3);
  assert.strictEqual(page.body.hasMore, true);
  assert.strictEqual(page.body.messages[2].text, 'Bulk 5');
  const older = await call(controller.getMessages, { user: studentA, params: { gigId: gig.id }, query: { before: new Date(page.body.messages[0].createdAt).toISOString(), limit: 3 } });
  // Inclusive boundary: the oldest message already shown comes back too (the client de-duplicates by id).
  assert.deepStrictEqual(older.body.messages.map(m => m.text), ['Bulk 1', 'Bulk 2', 'Bulk 3']);
});

test('the validator rejects script links and empty messages', () => {
  assert.strictEqual(sendMessageSchema.body.safeParse({ fileUrl: 'javascript:alert(1)' }).success, false);
  assert.strictEqual(sendMessageSchema.body.safeParse({ text: '   ' }).success, false);
  assert.strictEqual(sendMessageSchema.body.safeParse({ text: 'ok', fileUrl: 'https://files.example/a.pdf' }).success, true);
  assert.strictEqual(getMessagesSchema.query.safeParse({ after: 'yesterday-ish' }).success, false);
  assert.strictEqual(getMessagesSchema.query.safeParse({ limit: '500' }).success, false);
});

test('the gig completes once every hired freelancer’s work is accepted', async () => {
  for (const s of [studentA, studentB]) {
    const sub = await call(controller.submitWork, { user: s, params: { gigId: gig.id }, body: { text: `Work from ${s.email}` } });
    assert.strictEqual(sub.statusCode, 200);
  }
  await call(controller.completeGig, { user: recruiter, params: { gigId: gig.id }, body: { action: 'ACCEPT', candidateId: studentA.id } });
  let stored = await prisma.gig.findUnique({ where: { id: gig.id } });
  assert.strictEqual(stored.status, 'IN_PROGRESS');
  const bView = await call(controller.getGigDetails, { user: studentB, params: { gigId: gig.id } });
  assert.strictEqual(bView.body.mySubmission.text, `Work from ${studentB.email}`, 'freelancers only see their own deliverable');
  assert.strictEqual('submissions' in bView.body, false);
  const subs = await prisma.gigSubmission.findMany({ where: { gigId: gig.id } });
  assert.strictEqual(subs.find(s => s.candidateId === studentA.id).status, 'ACCEPTED');
  assert.strictEqual(subs.find(s => s.candidateId === studentB.id).status, 'PENDING', 'accepting A must not touch B');
  await call(controller.completeGig, { user: recruiter, params: { gigId: gig.id }, body: { action: 'ACCEPT', candidateId: studentB.id } });
  stored = await prisma.gig.findUnique({ where: { id: gig.id } });
  assert.strictEqual(stored.status, 'COMPLETED');
});
