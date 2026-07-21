#!/usr/bin/env node
/**
 * End-to-end verification of the temp question-bank flow, against the in-memory
 * mock ONLY. Deletes DATABASE_URL before requiring anything so it can never touch
 * production, and asserts isMock before doing any work.
 *
 *   node scripts/verifyBankFlow.js
 */
// Force the mock: set DATABASE_URL to '' BEFORE any require. config/db calls
// dotenv.config() (no override), which will NOT overwrite an already-set var, so
// '' survives and config/db picks the mock branch. (Deleting the var does NOT
// work — dotenv would repopulate it from .env and we'd hit production.)
process.env.DATABASE_URL = '';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

(async () => {
  const { prisma, isMock } = require('../src/config/db');
  // isMock is a FUNCTION — must be CALLED. Abort hard before any DB op if not mock.
  if (typeof isMock !== 'function' || isMock() !== true) {
    console.error('SAFETY ABORT: not running against the mock client. Refusing to touch the database.');
    process.exit(1);
  }

  // Fixture: 12 Python (should serve), 3 Java (below threshold, should fall back).
  const fixture = [];
  for (let i = 0; i < 12; i++) fixture.push({ skillName: 'Python', subtopic: 'Fixtures', question: `Py question ${i}?`, options: ['a', 'b', 'c', 'd'], correctIndex: i % 4, source: 'temp-bank-groq' });
  for (let i = 0; i < 3; i++) fixture.push({ skillName: 'Java', subtopic: 'Fixtures', question: `Java question ${i}?`, options: ['a', 'b', 'c', 'd'], correctIndex: 1, source: 'temp-bank-groq' });
  const tmp = path.join(os.tmpdir(), 'bank_fixture.json');
  fs.writeFileSync(tmp, JSON.stringify(fixture));

  const seed = require('./seedQuestions');

  // 1. Dry run writes nothing.
  const dry = await seed.run({ commit: false, file: tmp });
  assert.strictEqual(dry.wrote, 0, 'dry run must write nothing');
  assert.strictEqual(await prisma.question.count(), 0, 'DB must be empty after dry run');

  // 2. Commit writes all 15.
  const res = await seed.run({ commit: true, file: tmp });
  assert.strictEqual(res.wrote, 15, 'commit should write 15');
  assert.strictEqual(await prisma.question.count(), 15, 'DB should hold 15');

  // 3. Re-seed is idempotent (still 15, not 30).
  await seed.run({ commit: true, file: tmp });
  assert.strictEqual(await prisma.question.count(), 15, 're-seed must not duplicate');

  // 4. Serve path — Python (>=10) serves a clean 10.
  const ctrl = require('../src/controllers/student.controller');
  const py = await ctrl._getBankTest('python'); // lower-case → tests case-insensitive match
  assert.ok(py, 'Python should serve from bank');
  assert.strictEqual(py.source, 'bank');
  assert.strictEqual(py.questions.length, 10, 'should serve exactly 10');
  for (const q of py.questions) {
    assert.ok(typeof q.question === 'string' && q.question, 'question text present');
    assert.strictEqual(q.options.length, 4, '4 options');
    assert.ok(['A', 'B', 'C', 'D'].includes(q.answer), 'answer is an A-D letter');
    assert.strictEqual(q.correctIndex, undefined, 'correctIndex must NOT leak to client shape');
  }

  // 5. Java (<10) falls back (returns null so the handler calls live generation).
  const ja = await ctrl._getBankTest('Java');
  assert.strictEqual(ja, null, 'Java below threshold must return null (fall back)');

  console.log('ALL BANK-FLOW CHECKS PASSED (mock only):');
  console.log('  - dry run wrote nothing; commit wrote 15; re-seed stayed 15 (idempotent)');
  console.log('  - Python served exactly 10; answers are A-D letters; correctIndex did not leak');
  console.log('  - Java (<10) returned null → falls back to live generation');
})().catch((e) => { console.error('VERIFY FAILED:', e.stack || e.message); process.exit(1); });
