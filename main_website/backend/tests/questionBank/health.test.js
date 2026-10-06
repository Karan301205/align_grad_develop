const { test } = require('node:test');
const assert = require('node:assert');
const { evaluateHealth, classify, CATEGORY } = require('../../src/services/questionBank/health');

const NOW = new Date('2026-07-23T00:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000);
const base = { status: 'ACTIVE', reviewState: 'NONE', usageCount: 0, correctCount: 0, wrongCount: 0, skipCount: 0, lastUsed: null, lastReviewed: null };

test('Healthy: high accuracy, enough answers', () => {
  const r = evaluateHealth({ ...base, usageCount: 30, correctCount: 25, wrongCount: 5 }, undefined, NOW);
  assert.strictEqual(r.category, CATEGORY.HEALTHY);
  assert.strictEqual(r.reviewState, 'NONE');
});

test('Replacement Candidate: very low correct rate over enough answers', () => {
  const r = evaluateHealth({ ...base, usageCount: 30, correctCount: 5, wrongCount: 25 }, undefined, NOW);
  assert.strictEqual(r.category, CATEGORY.REPLACEMENT);
  assert.strictEqual(r.reviewState, 'REPLACEMENT_CANDIDATE');
  assert.ok(r.reasons.length > 0);
});

test('Replacement Candidate: high skip rate (accuracy untrusted)', () => {
  const r = evaluateHealth({ ...base, usageCount: 40, correctCount: 8, wrongCount: 7, skipCount: 25 }, undefined, NOW);
  assert.strictEqual(r.category, CATEGORY.REPLACEMENT);
});

test('Needs Review: middling correct rate', () => {
  const r = evaluateHealth({ ...base, usageCount: 30, correctCount: 12, wrongCount: 18 }, undefined, NOW);
  assert.strictEqual(r.category, CATEGORY.NEEDS_REVIEW);
  assert.strictEqual(r.reviewState, 'NEEDS_REVIEW');
});

test('Needs Review: healthy accuracy but heavily used and long unreviewed', () => {
  const r = evaluateHealth({ ...base, usageCount: 60, correctCount: 55, wrongCount: 5, lastReviewed: daysAgo(200) }, undefined, NOW);
  assert.strictEqual(r.category, CATEGORY.NEEDS_REVIEW);
});

test('too few answers → not classified by rate (stays Healthy)', () => {
  const r = evaluateHealth({ ...base, usageCount: 10, correctCount: 1, wrongCount: 9 }, undefined, NOW);
  assert.strictEqual(r.category, CATEGORY.HEALTHY, 'early noise must not misclassify');
});

test('config override changes the threshold (minAnswersForRates)', () => {
  const q = { ...base, usageCount: 10, correctCount: 1, wrongCount: 9 };
  const r = evaluateHealth(q, { minAnswersForRates: 5 }, NOW);
  assert.strictEqual(r.category, CATEGORY.REPLACEMENT, 'lowered threshold now trusts the low accuracy');
});

test('Retired is driven by status', () => {
  const r = evaluateHealth({ ...base, status: 'RETIRED', usageCount: 30, correctCount: 30 }, undefined, NOW);
  assert.strictEqual(r.category, CATEGORY.RETIRED);
});

test('classify tallies categories across a list', () => {
  const { summary } = classify([
    { ...base, id: 'a', usageCount: 30, correctCount: 28, wrongCount: 2 },       // Healthy
    { ...base, id: 'b', usageCount: 30, correctCount: 4, wrongCount: 26 },        // Replacement
    { ...base, id: 'c', usageCount: 30, correctCount: 12, wrongCount: 18 },       // Needs Review
    { ...base, id: 'd', status: 'RETIRED' },                                      // Retired
  ], undefined, NOW);
  assert.strictEqual(summary[CATEGORY.HEALTHY], 1);
  assert.strictEqual(summary[CATEGORY.REPLACEMENT], 1);
  assert.strictEqual(summary[CATEGORY.NEEDS_REVIEW], 1);
  assert.strictEqual(summary[CATEGORY.RETIRED], 1);
});
