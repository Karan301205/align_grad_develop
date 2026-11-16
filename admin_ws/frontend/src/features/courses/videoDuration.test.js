import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration } from './videoDuration.js';

test('formatDuration writes minutes and seconds, and hours only when there are some', () => {
  assert.equal(formatDuration(1125), '18:45');
  assert.equal(formatDuration(900), '15:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(11001), '3:03:21');
  assert.equal(formatDuration(3600), '1:00:00');
  assert.equal(formatDuration(3599), '59:59');
});

test('formatDuration rounds to the nearest second', () => {
  assert.equal(formatDuration(18.4), '0:18');
  assert.equal(formatDuration(18.6), '0:19');
  assert.equal(formatDuration('83'), '1:23');
});

test('formatDuration gives null for anything that is not a positive length (so the form keeps its value)', () => {
  for (const bad of [0, -5, NaN, Infinity, null, undefined, '', 'abc', 0.4]) assert.equal(formatDuration(bad), null, String(bad));
});
