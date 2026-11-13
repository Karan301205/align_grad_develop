const test = require('node:test');
const assert = require('node:assert');
const { scoreAnswers, passMark, countUnanswered } = require('../../src/services/questionBank/scoring');

test('passMark: 7 of 10, matches scoreAnswers threshold for other sizes', () => {
  assert.strictEqual(passMark(10), 7);
  assert.strictEqual(passMark(0), 0);
  for (const total of [1, 3, 7, 9, 10, 12]) {
    const key = Array(total).fill(0);
    const mark = passMark(total);
    const atMark = scoreAnswers(key, [...Array(mark).fill(0), ...Array(total - mark).fill(1)]);
    assert.strictEqual(atMark.passed, true, `total ${total}: ${mark} correct should pass`);
    if (mark > 0) {
      const below = scoreAnswers(key, [...Array(mark - 1).fill(0), ...Array(total - mark + 1).fill(1)]);
      assert.strictEqual(below.passed, false, `total ${total}: ${mark - 1} correct should fail`);
    }
  }
});

test('countUnanswered: short, sparse and out-of-range answers count as missing', () => {
  const key = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1];
  assert.strictEqual(countUnanswered(key, [...key]), 0);
  assert.strictEqual(countUnanswered(key, [0]), 9);
  assert.strictEqual(countUnanswered(key, []), 10);
  assert.strictEqual(countUnanswered(key, [0, null, 2, -1, 4, 1.5, 2, 3, 0, 1]), 4);
  assert.strictEqual(countUnanswered(key, undefined), 10);
});

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
