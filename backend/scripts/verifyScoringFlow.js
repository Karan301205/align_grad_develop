#!/usr/bin/env node
/**
 * End-to-end security verification for the server-scored assessment flow, against
 * the in-memory mock ONLY. Proves Decision 1 / Plan 2 holes are closed:
 *   - generate never leaks the answer key
 *   - submit scores server-side (client cannot self-assign a score)
 *   - only a passing assessment raises the rating
 *   - sessions are single-use and reject fabricated ids
 *   - updateProfile ignores client-supplied ratings (default 1)
 *
 *   node scripts/verifyScoringFlow.js
 */
process.env.DATABASE_URL = ''; // force mock BEFORE any require (see aligngrad-forcing-mock-db)
const assert = require('assert');

function call(fn, body, userId) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(payload) { resolve({ status: this.statusCode, body: payload }); },
    };
    Promise.resolve(fn({ body, user: { id: userId } }, res)).catch(reject);
  });
}

(async () => {
  const { prisma, isMock } = require('../src/config/db');
  if (typeof isMock !== 'function' || isMock() !== true) {
    console.error('SAFETY ABORT: not the mock client.'); process.exit(1);
  }
  const ctrl = require('../src/controllers/student.controller');
  const userId = 'user-1';

  // Seed 10 bank questions, ALL correctIndex 0 → served answerKey is all 0s
  // regardless of shuffle, so we can submit known-correct/known-wrong answers.
  for (let i = 0; i < 10; i++) {
    await prisma.question.create({ data: { skillName: 'ZTest', subtopic: 'T', question: `Q${i}?`, options: ['a', 'b', 'c', 'd'], correctIndex: 0, source: 'test' } });
  }
  await prisma.profile.create({ data: { userId, name: 'Tester', skills: [] } });

  // 1. generate → sessionId + 10 questions, NO answer key leaked.
  const gen = await call(ctrl.generateSkillTest, { skillName: 'ZTest' }, userId);
  assert.strictEqual(gen.status, 200, 'generate 200');
  assert.ok(gen.body.sessionId, 'sessionId present');
  assert.strictEqual(gen.body.questions.length, 10, '10 questions');
  for (const q of gen.body.questions) {
    assert.strictEqual(q.answer, undefined, 'no answer letter leaked');
    assert.strictEqual(q.correctIndex, undefined, 'no correctIndex leaked');
  }

  // 2. OLD HOLE closed: submitting a client score (no session) is rejected.
  const oldHole = await call(ctrl.submitSkillTest, { skillName: 'ZTest', score: 100 }, userId);
  assert.strictEqual(oldHole.status, 400, 'client-score payload rejected');

  // 3. Fabricated session id → rejected.
  const fake = await call(ctrl.submitSkillTest, { sessionId: 'does-not-exist', answers: [0,0,0,0,0,0,0,0,0,0] }, userId);
  assert.strictEqual(fake.status, 400, 'fabricated session rejected');

  // 4. Correct answers (all 0) → 100%, passed, verifiedRating set to 10.
  const good = await call(ctrl.submitSkillTest, { sessionId: gen.body.sessionId, answers: [0,0,0,0,0,0,0,0,0,0] }, userId);
  assert.strictEqual(good.status, 200, 'submit 200');
  assert.strictEqual(good.body.score, 100, 'server-scored 100');
  assert.strictEqual(good.body.passed, true, 'passed');
  const zskill = good.body.skills.find((s) => s.name === 'ZTest');
  assert.ok(zskill && zskill.verifiedRating === 10 && zskill.rating === 10, 'rating raised to 10 on pass');

  // 5. Replay the same session → rejected (single-use).
  const replay = await call(ctrl.submitSkillTest, { sessionId: gen.body.sessionId, answers: [0,0,0,0,0,0,0,0,0,0] }, userId);
  assert.strictEqual(replay.status, 400, 'used session rejected on replay');

  // 6. A NEW session with wrong answers (all 1) → 0%, not passed, rating NOT changed.
  const gen2 = await call(ctrl.generateSkillTest, { skillName: 'ZTest' }, userId);
  const bad = await call(ctrl.submitSkillTest, { sessionId: gen2.body.sessionId, answers: [1,1,1,1,1,1,1,1,1,1] }, userId);
  assert.strictEqual(bad.body.score, 0, 'wrong answers → 0');
  assert.strictEqual(bad.body.passed, false, 'not passed');
  const prof = await prisma.profile.findUnique({ where: { userId } });
  const still = prof.skills.find((s) => s.name === 'ZTest');
  assert.strictEqual(still.verifiedRating, 10, 'failed attempt did NOT lower/raise the earned rating');

  // 7. updateProfile ignores client-supplied ratings. A real update sends the full
  // skills list (set-replaces the array), so include the already-earned ZTest.
  await call(ctrl.updateProfile, { skills: [{ name: 'ZTest', rating: 1 }, { name: 'Rust', rating: 9, verifiedRating: 9 }] }, userId);
  const prof2 = await prisma.profile.findUnique({ where: { userId } });
  const rust = prof2.skills.find((s) => s.name === 'Rust');
  assert.ok(rust, 'Rust added');
  assert.strictEqual(rust.rating, 1, 'client rating 9 ignored → defaults to 1');
  assert.strictEqual(rust.verifiedRating, undefined, 'no client-set verifiedRating on new skill');
  // The assessment-earned ZTest rating is preserved (client tried to set it to 1).
  const zAfter = prof2.skills.find((s) => s.name === 'ZTest');
  assert.strictEqual(zAfter.rating, 10, 'earned rating preserved; client cannot lower it');
  assert.strictEqual(zAfter.verifiedRating, 10, 'earned verifiedRating preserved');

  console.log('ALL SCORING-FLOW SECURITY CHECKS PASSED (mock only):');
  console.log('  - generate leaks no answer key; 10 options-only questions');
  console.log('  - client-score payload rejected; fabricated + replayed sessions rejected');
  console.log('  - server-scored 100% pass raised rating to 10; failed attempt left it untouched');
  console.log('  - updateProfile ignored client rating 9 → new skill defaulted to 1; earned rating preserved');
})().catch((e) => { console.error('VERIFY FAILED:', e.stack || e.message); process.exit(1); });
