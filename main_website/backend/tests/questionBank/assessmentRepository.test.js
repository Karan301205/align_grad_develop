const { test } = require('node:test');
const assert = require('node:assert');
const repo = require('../../src/services/questionBank/repositories/assessmentRepository');

function fakeClient() {
  const rows = [];
  return {
    _rows: rows,
    assessmentRecord: {
      create: async ({ data }) => { const row = { id: `ar_${rows.length}`, createdAt: new Date(), ...data }; rows.push(row); return row; },
      findMany: async ({ where = {} }) => rows.filter((r) => where.candidateId === undefined || r.candidateId === where.candidateId),
    },
  };
}

test('record persists all analytics fields', async () => {
  const client = fakeClient();
  const started = new Date('2026-07-23T10:00:00Z');
  const ended = new Date('2026-07-23T10:08:00Z');
  const row = await repo.record({
    candidateId: 'u1', skill: 'Python', questionIds: ['q1', 'q2', 'q3'],
    startedAt: started, endedAt: ended,
    totalQuestions: 10, correctAnswers: 7, wrongAnswers: 2, skippedQuestions: 1,
    finalScore: 70, passed: true,
  }, client);

  assert.strictEqual(row.candidateId, 'u1');
  assert.strictEqual(row.skill, 'Python');
  assert.deepStrictEqual(row.questionIds, ['q1', 'q2', 'q3']);
  assert.strictEqual(row.startedAt, started);
  assert.strictEqual(row.endedAt, ended);
  assert.strictEqual(row.totalQuestions, 10);
  assert.strictEqual(row.correctAnswers, 7);
  assert.strictEqual(row.wrongAnswers, 2);
  assert.strictEqual(row.skippedQuestions, 1);
  assert.strictEqual(row.finalScore, 70);
  assert.strictEqual(row.passed, true);
});

test('findByCandidate returns only that candidate\'s records (history preserved)', async () => {
  const client = fakeClient();
  await repo.record({ candidateId: 'u1', skill: 'Go', questionIds: [], startedAt: new Date(), endedAt: new Date(), totalQuestions: 10, correctAnswers: 5, wrongAnswers: 5, skippedQuestions: 0, finalScore: 50, passed: false }, client);
  await repo.record({ candidateId: 'u2', skill: 'Go', questionIds: [], startedAt: new Date(), endedAt: new Date(), totalQuestions: 10, correctAnswers: 9, wrongAnswers: 1, skippedQuestions: 0, finalScore: 90, passed: true }, client);
  await repo.record({ candidateId: 'u1', skill: 'Java', questionIds: [], startedAt: new Date(), endedAt: new Date(), totalQuestions: 10, correctAnswers: 8, wrongAnswers: 2, skippedQuestions: 0, finalScore: 80, passed: true }, client);

  const u1 = await repo.findByCandidate('u1', client);
  assert.strictEqual(u1.length, 2, 'both of u1 records, none of u2');
  assert.ok(u1.every((r) => r.candidateId === 'u1'));
});

test('assessment records are immutable (append-only repository)', () => {
  // Production-safety invariant: no update/delete/remove path exists, so historical
  // analytics cannot be mutated through the repository.
  assert.strictEqual(typeof repo.update, 'undefined');
  assert.strictEqual(typeof repo.delete, 'undefined');
  assert.strictEqual(typeof repo.remove, 'undefined');
  assert.strictEqual(typeof repo.record, 'function');
});
