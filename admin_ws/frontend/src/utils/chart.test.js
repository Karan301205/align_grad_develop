import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasAny, niceScale, percentOf, weekLabel, weekRangeLabel } from './chart.js';

test('niceScale gives whole-number axes that always reach the maximum', () => {
  assert.deepEqual(niceScale(3).ticks, [0, 1, 2, 3]);
  assert.deepEqual(niceScale(1).ticks, [0, 1]);
  assert.deepEqual(niceScale(8).ticks, [0, 2, 4, 6, 8]);
  assert.deepEqual(niceScale(9).ticks, [0, 5, 10]);
  assert.deepEqual(niceScale(23).ticks, [0, 10, 20, 30]);
  assert.deepEqual(niceScale(100).ticks, [0, 50, 100]);
  for (const max of [1, 2, 3, 5, 7, 11, 19, 42, 99, 250, 1234]) {
    const scale = niceScale(max);
    assert.ok(scale.max >= max, `${scale.max} must cover ${max}`);
    assert.ok(Number.isInteger(scale.step) && scale.step >= 1);
    assert.equal(scale.ticks.at(-1), scale.max);
    assert.ok(scale.ticks.length <= 7, `too many ticks for ${max}`);
  }
});

test('niceScale gives an empty chart a 0 to 4 axis, and survives bad input', () => {
  assert.deepEqual(niceScale(0).ticks, [0, 1, 2, 3, 4]);
  assert.deepEqual(niceScale(undefined).ticks, [0, 1, 2, 3, 4]);
  assert.deepEqual(niceScale(-5).ticks, [0, 1, 2, 3, 4]);
  assert.deepEqual(niceScale('x').ticks, [0, 1, 2, 3, 4]);
});

test('weekLabel shows the first day of the week', () => {
  assert.equal(weekLabel('2026-11-09'), '9 Nov');
  assert.equal(weekLabel('2026-01-05'), '5 Jan');
  assert.equal(weekLabel('2026-12-28'), '28 Dec');
  assert.equal(weekLabel('nonsense'), '');
  assert.equal(weekLabel(undefined), '');
});

test('weekRangeLabel spans seven days, including across a month or year end', () => {
  assert.equal(weekRangeLabel('2026-11-09'), '9–15 Nov');
  assert.equal(weekRangeLabel('2026-10-26'), '26 Oct–1 Nov');
  assert.equal(weekRangeLabel('2026-12-28'), '28 Dec–3 Jan');
  assert.equal(weekRangeLabel('bad'), '');
});

test('percentOf rounds and never divides by zero', () => {
  assert.equal(percentOf(1, 3), 33);
  assert.equal(percentOf(2, 3), 67);
  assert.equal(percentOf(0, 0), 0);
  assert.equal(percentOf(5, 0), 0);
  assert.equal(percentOf(10, 10), 100);
});

test('hasAny is true only when some value is above zero', () => {
  assert.equal(hasAny([0, 0, 0]), false);
  assert.equal(hasAny([]), false);
  assert.equal(hasAny([0, 2]), true);
  assert.equal(hasAny(['0', '3']), true);
  assert.equal(hasAny([-1, 0]), false);
});
