const { test } = require('node:test');
const assert = require('node:assert');
const { selectQuestions, DEFAULT_DIFFICULTY_MIX, scaleMix } = require('../../src/services/questionBank/selection');

// Build a pool: `subs` subtopics, each with `per` questions cycling difficulties.
function makePool(subs, per, difficulties = ['Medium', 'Medium-Hard', 'Hard']) {
  const pool = [];
  let n = 0;
  for (let s = 0; s < subs; s++) {
    for (let i = 0; i < per; i++) {
      pool.push({
        id: `q${n}`,
        skillName: 'Python',
        subtopic: `sub${s}`,
        difficulty: difficulties[n % difficulties.length],
        question: `Q${n}?`,
        options: ['a', 'b', 'c', 'd'],
        correctIndex: n % 4,
      });
      n++;
    }
  }
  return pool;
}

test('selects exactly `count` distinct questions with no duplicates', () => {
  const picked = selectQuestions(makePool(5, 10), { count: 10, seed: 123 });
  assert.strictEqual(picked.length, 10);
  const ids = picked.map((q) => q.id);
  assert.strictEqual(new Set(ids).size, 10, 'no duplicate questions in one assessment');
});

test('is deterministic for a given seed', () => {
  const pool = makePool(6, 8);
  const a = selectQuestions(pool, { count: 10, seed: 777 }).map((q) => q.id);
  const b = selectQuestions(pool, { count: 10, seed: 777 }).map((q) => q.id);
  assert.deepStrictEqual(a, b, 'same seed yields the same selection');
});

test('distributes across multiple subtopics, not one area', () => {
  // 5 subtopics available, need 10 → should touch every subtopic (round-robin).
  const picked = selectQuestions(makePool(5, 10), { count: 10, seed: 5 });
  const subs = new Set(picked.map((q) => q.subtopic));
  assert.strictEqual(subs.size, 5, 'all subtopics represented');
});

test('honours the difficulty mix when the pool is rich enough', () => {
  const pool = makePool(6, 12); // plenty of every difficulty
  const picked = selectQuestions(pool, { count: 10, seed: 42 });
  const counts = {};
  for (const q of picked) counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;
  const quota = scaleMix(DEFAULT_DIFFICULTY_MIX, 10);
  assert.deepStrictEqual(counts, quota, 'difficulty distribution matches the configured mix');
});

test('respects a custom difficultyMix from config', () => {
  const pool = makePool(6, 12);
  const picked = selectQuestions(pool, { count: 10, seed: 9, difficultyMix: { Hard: 1 } });
  assert.ok(picked.every((q) => q.difficulty === 'Hard'), 'all Hard when mix asks only for Hard');
});

test('returns the whole pool (deduped) when it is smaller than count', () => {
  const pool = makePool(2, 3); // only 6 questions
  const picked = selectQuestions(pool, { count: 10, seed: 1 });
  assert.strictEqual(picked.length, 6);
  assert.strictEqual(new Set(picked.map((q) => q.id)).size, 6);
});

test('empty pool yields an empty selection (no throw)', () => {
  assert.deepStrictEqual(selectQuestions([], { count: 10 }), []);
  assert.deepStrictEqual(selectQuestions(undefined, { count: 10 }), []);
});

// --- Phase 5: usage-aware selection ---

test('prioritises least-used questions', () => {
  // 12 questions in one subtopic; 2 are unused, the rest heavily used.
  const pool = [];
  for (let i = 0; i < 12; i++) {
    pool.push({ id: `q${i}`, skillName: 'Go', subtopic: 'Channels', difficulty: 'Medium', question: `Q${i}`, options: ['a', 'b', 'c', 'd'], correctIndex: 0, usageCount: i < 2 ? 0 : 100 });
  }
  const picked = selectQuestions(pool, { count: 5, seed: 3, difficultyMix: { Medium: 5 } });
  const ids = picked.map((q) => q.id);
  assert.ok(ids.includes('q0') && ids.includes('q1'), 'the two unused questions are chosen first');
});

test('spreads among equally-used candidates (varies by seed)', () => {
  const pool = [];
  for (let i = 0; i < 20; i++) pool.push({ id: `q${i}`, skillName: 'Go', subtopic: 's', difficulty: 'Medium', question: `Q${i}`, options: ['a', 'b', 'c', 'd'], correctIndex: 0, usageCount: 0 });
  const a = selectQuestions(pool, { count: 5, seed: 1, difficultyMix: { Medium: 5 } }).map((q) => q.id).sort();
  const b = selectQuestions(pool, { count: 5, seed: 2, difficultyMix: { Medium: 5 } }).map((q) => q.id).sort();
  assert.notDeepStrictEqual(a, b, 'different seeds pick different least-used candidates → natural distribution');
});
