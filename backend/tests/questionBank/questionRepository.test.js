const { test } = require('node:test');
const assert = require('node:assert');
const repo = require('../../src/services/questionBank/repositories/questionRepository');

// Minimal in-memory Prisma-like client with atomic `{ increment }` support, so we
// can assert counter accuracy without a database.
function fakeClient(seedRows) {
  const rows = seedRows.map((r) => ({ usageCount: 0, correctCount: 0, wrongCount: 0, skipCount: 0, lastUsed: null, status: 'ACTIVE', ...r }));
  const apply = (row, data) => {
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && 'increment' in v) row[k] = (row[k] || 0) + v.increment;
      else row[k] = v;
    }
  };
  return {
    _rows: rows,
    question: {
      findMany: async ({ where = {} }) => rows.filter((q) => {
        if (where.status && q.status !== where.status) return false;
        if (where.skillName) {
          const t = (where.skillName.equals || where.skillName);
          if (q.skillName.toLowerCase() !== String(t).toLowerCase()) return false;
        }
        return true;
      }),
      updateMany: async ({ where = {}, data = {} }) => {
        const idIn = where.id && Array.isArray(where.id.in) ? new Set(where.id.in) : null;
        let count = 0;
        for (const q of rows) { if (idIn && !idIn.has(q.id)) continue; apply(q, data); count++; }
        return { count };
      },
    },
  };
}

test('findActiveBySkill returns only ACTIVE questions for the skill', async () => {
  const client = fakeClient([
    { id: 'a', skillName: 'Go', status: 'ACTIVE' },
    { id: 'b', skillName: 'Go', status: 'RETIRED' },
    { id: 'c', skillName: 'Python', status: 'ACTIVE' },
  ]);
  const rows = await repo.findActiveBySkill('go', client);
  assert.deepStrictEqual(rows.map((r) => r.id), ['a'], 'excludes retired and other skills, case-insensitive');
});

test('recordServed atomically bumps usageCount and stamps lastUsed', async () => {
  const client = fakeClient([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  await repo.recordServed(['a', 'b'], client);
  const byId = Object.fromEntries(client._rows.map((r) => [r.id, r]));
  assert.strictEqual(byId.a.usageCount, 1);
  assert.strictEqual(byId.b.usageCount, 1);
  assert.strictEqual(byId.c.usageCount, 0, 'unserved question untouched');
  assert.ok(byId.a.lastUsed instanceof Date, 'lastUsed stamped');
});

test('usage counts stay accurate across repeated assessments', async () => {
  const client = fakeClient([{ id: 'a' }]);
  await repo.recordServed(['a'], client);
  await repo.recordServed(['a'], client);
  await repo.recordServed(['a'], client);
  assert.strictEqual(client._rows[0].usageCount, 3, 'increments accumulate, never overwrite');
});

test('recordOutcomes increments the right disjoint buckets', async () => {
  const client = fakeClient([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  await repo.recordOutcomes({ correctIds: ['a'], wrongIds: ['b'], skipIds: ['c'] }, client);
  const byId = Object.fromEntries(client._rows.map((r) => [r.id, r]));
  assert.strictEqual(byId.a.correctCount, 1);
  assert.strictEqual(byId.a.wrongCount, 0);
  assert.strictEqual(byId.b.wrongCount, 1);
  assert.strictEqual(byId.c.skipCount, 1);
});

test('empty id lists are no-ops (no wasted writes)', async () => {
  const client = fakeClient([{ id: 'a' }]);
  const served = await repo.recordServed([], client);
  assert.strictEqual(served.count, 0);
  await repo.recordOutcomes({ correctIds: [], wrongIds: [], skipIds: [] }, client);
  assert.strictEqual(client._rows[0].usageCount, 0);
});
