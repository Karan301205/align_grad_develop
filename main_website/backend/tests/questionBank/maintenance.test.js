const { test } = require('node:test');
const assert = require('node:assert');
const { runHealthReview } = require('../../src/services/questionBank/maintenance');

function fakeClient(seedRows) {
  const rows = seedRows.map((r) => ({ status: 'ACTIVE', reviewState: 'NONE', usageCount: 0, correctCount: 0, wrongCount: 0, skipCount: 0, lastUsed: null, lastReviewed: null, ...r }));
  const apply = (row, data) => { for (const [k, v] of Object.entries(data)) row[k] = (v && typeof v === 'object' && 'increment' in v) ? (row[k] || 0) + v.increment : v; };
  return {
    _rows: rows,
    question: {
      findMany: async ({ where = {} }) => rows.filter((q) => !(where.status && where.status.not && q.status === where.status.not)),
      updateMany: async ({ where = {}, data = {} }) => {
        const idIn = where.id && Array.isArray(where.id.in) ? new Set(where.id.in) : null;
        let count = 0;
        for (const q of rows) { if (idIn && !idIn.has(q.id)) continue; apply(q, data); count++; }
        return { count };
      },
    },
  };
}

const NOW = new Date('2026-07-23T00:00:00Z');

test('runHealthReview flags replacement candidates and preserves all stats', async () => {
  const client = fakeClient([
    { id: 'good', usageCount: 30, correctCount: 28, wrongCount: 2 },   // Healthy
    { id: 'bad', usageCount: 30, correctCount: 4, wrongCount: 26 },     // Replacement
    { id: 'mid', usageCount: 30, correctCount: 12, wrongCount: 18 },    // Needs Review
  ]);
  const res = await runHealthReview({ apply: true, client, now: NOW });

  const byId = Object.fromEntries(client._rows.map((r) => [r.id, r]));
  assert.strictEqual(byId.bad.reviewState, 'REPLACEMENT_CANDIDATE');
  assert.strictEqual(byId.mid.reviewState, 'NEEDS_REVIEW');
  assert.strictEqual(byId.good.reviewState, 'NONE');
  assert.ok(byId.bad.lastReviewed instanceof Date, 'lastReviewed stamped on flag');

  // Historical stats untouched by the maintenance pass.
  assert.strictEqual(byId.bad.usageCount, 30);
  assert.strictEqual(byId.bad.correctCount, 4);
  assert.strictEqual(byId.bad.wrongCount, 26);
  assert.strictEqual(res.summary['Replacement Candidate'], 1);
});

test('dry-run (apply:false) writes nothing', async () => {
  const client = fakeClient([{ id: 'bad', usageCount: 30, correctCount: 4, wrongCount: 26 }]);
  const res = await runHealthReview({ apply: false, client, now: NOW });
  assert.strictEqual(client._rows[0].reviewState, 'NONE', 'no persistence on dry-run');
  assert.strictEqual(res.changed.REPLACEMENT_CANDIDATE.length, 1, 'still reports what WOULD change');
});

test('retired questions are excluded from the review pool', async () => {
  const client = fakeClient([
    { id: 'active', usageCount: 30, correctCount: 28, wrongCount: 2 },
    { id: 'retired', status: 'RETIRED' },
  ]);
  const res = await runHealthReview({ apply: true, client, now: NOW });
  assert.strictEqual(res.evaluated, 1, 'RETIRED excluded from evaluation');
});
