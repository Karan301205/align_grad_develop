// Tests for testSessionRepository. Like skillDefinitionRepository.test.js, this
// stubs config/db in require.cache BEFORE requiring the repo, because db.js fires
// a live-Atlas connectivity probe at require time. Every test injects its own
// in-memory fake client via the DI seam.
const test = require('node:test');
const assert = require('node:assert');

const dbModulePath = require.resolve('../../src/config/db');
require.cache[dbModulePath] = {
  id: dbModulePath,
  filename: dbModulePath,
  loaded: true,
  exports: { prisma: {}, isMock: () => true },
};

const { create, findValidForUser, markUsed } =
  require('../../src/services/questionBank/repositories/testSessionRepository');

function fakeClient(initial = []) {
  const rows = [...initial];
  return {
    testSession: {
      create: async ({ data }) => { const row = { id: `ts_${rows.length}`, ...data }; rows.push(row); return row; },
      findUnique: async ({ where }) => rows.find((r) => r.id === where.id) || null,
      update: async ({ where, data }) => {
        const r = rows.find((x) => x.id === where.id);
        if (!r) return null;
        Object.assign(r, data);
        return r;
      },
    },
  };
}

test('create stores a session with used=false and the answer key', async () => {
  const c = fakeClient();
  const s = await create({ userId: 'u1', skillName: 'Python', answerKey: [0, 1, 2], expiresAt: new Date(Date.now() + 1000) }, c);
  assert.strictEqual(s.userId, 'u1');
  assert.strictEqual(s.used, false);
  assert.deepStrictEqual(s.answerKey, [0, 1, 2]);
});

test('findValidForUser returns null for a different user', async () => {
  const future = new Date(Date.now() + 60000);
  const c = fakeClient([{ id: 's1', userId: 'u1', used: false, expiresAt: future, answerKey: [0] }]);
  assert.strictEqual(await findValidForUser('s1', 'someone-else', c), null);
});

test('findValidForUser returns null for an already-used session', async () => {
  const future = new Date(Date.now() + 60000);
  const c = fakeClient([{ id: 's1', userId: 'u1', used: true, expiresAt: future, answerKey: [0] }]);
  assert.strictEqual(await findValidForUser('s1', 'u1', c), null);
});

test('findValidForUser returns null for an expired session', async () => {
  const past = new Date(Date.now() - 1000);
  const c = fakeClient([{ id: 's1', userId: 'u1', used: false, expiresAt: past, answerKey: [0] }]);
  assert.strictEqual(await findValidForUser('s1', 'u1', c), null);
});

test('findValidForUser returns the session when it is valid', async () => {
  const future = new Date(Date.now() + 60000);
  const c = fakeClient([{ id: 's1', userId: 'u1', used: false, expiresAt: future, answerKey: [0, 1] }]);
  const s = await findValidForUser('s1', 'u1', c);
  assert.ok(s);
  assert.strictEqual(s.id, 's1');
});

test('markUsed flips used and records score/passed', async () => {
  const future = new Date(Date.now() + 60000);
  const c = fakeClient([{ id: 's1', userId: 'u1', used: false, expiresAt: future, answerKey: [0] }]);
  const s = await markUsed('s1', { score: 80, passed: true }, c);
  assert.strictEqual(s.used, true);
  assert.strictEqual(s.score, 80);
  assert.strictEqual(s.passed, true);
});
