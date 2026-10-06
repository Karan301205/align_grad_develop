const test = require('node:test');
const assert = require('node:assert');
const { scoreAnswers } = require('../../src/services/questionBank/scoring');

test('all correct → 100%, passed, rating 10', () => {
  const key = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1];
  const r = scoreAnswers(key, [...key]);
  assert.strictEqual(r.correct, 10);
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.passed, true);
  assert.strictEqual(r.rating, 10);
});

test('exactly 7/10 → 70%, passed (threshold), rating 7', () => {
  const key = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const ans = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1]; // 7 correct
  const r = scoreAnswers(key, ans);
  assert.strictEqual(r.correct, 7);
  assert.strictEqual(r.score, 70);
  assert.strictEqual(r.passed, true);
  assert.strictEqual(r.rating, 7);
});

test('6/10 → 60%, NOT passed', () => {
  const key = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const ans = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]; // 6 correct
  const r = scoreAnswers(key, ans);
  assert.strictEqual(r.correct, 6);
  assert.strictEqual(r.passed, false);
  assert.strictEqual(r.rating, 6);
});

test('missing answers count as wrong; no crash; rating floored at 1', () => {
  const r = scoreAnswers([0, 1, 2], []);
  assert.strictEqual(r.correct, 0);
  assert.strictEqual(r.total, 3);
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.passed, false);
  assert.strictEqual(r.rating, 1);
});

test('empty answer key → 0%, rating 1, not passed', () => {
  const r = scoreAnswers([], []);
  assert.strictEqual(r.total, 0);
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.rating, 1);
  assert.strictEqual(r.passed, false);
});
