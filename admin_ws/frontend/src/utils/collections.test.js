import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesQuery, countBy, paginate, pageWindow } from './collections.js';

test('matchesQuery matches any field, ignoring case and surrounding spaces', () => {
  assert.equal(matchesQuery(['Sai Vivek', 'sai@x.com'], 'VIVEK'), true);
  assert.equal(matchesQuery(['Sai Vivek', 'sai@x.com'], '  x.com '), true);
  assert.equal(matchesQuery(['Sai Vivek'], 'rahul'), false);
});

test('matchesQuery treats an empty query as match-all and tolerates null fields', () => {
  assert.equal(matchesQuery(['a'], ''), true);
  assert.equal(matchesQuery(['a'], '   '), true);
  assert.equal(matchesQuery(['a'], undefined), true);
  assert.equal(matchesQuery([null, undefined, 'abc'], 'b'), true);
  assert.equal(matchesQuery([null, undefined], 'b'), false);
});

test('countBy counts the items passing each predicate', () => {
  const items = [1, 2, 3, 4, 5];
  assert.deepEqual(countBy(items, { all: () => true, even: (n) => n % 2 === 0, big: (n) => n > 10 }), { all: 5, even: 2, big: 0 });
  assert.deepEqual(countBy([], { all: () => true }), { all: 0 });
});

test('paginate returns the right slice and page numbers', () => {
  const items = Array.from({ length: 10 }, (_, i) => i + 1);
  const second = paginate(items, 2, 4);
  assert.deepEqual(second.rows, [5, 6, 7, 8]);
  assert.deepEqual({ page: second.page, pages: second.pages, total: second.total, from: second.from, to: second.to }, { page: 2, pages: 3, total: 10, from: 5, to: 8 });
  const last = paginate(items, 3, 4);
  assert.deepEqual(last.rows, [9, 10]);
  assert.equal(last.to, 10);
});

test('paginate clamps out-of-range and invalid pages', () => {
  const items = [1, 2, 3, 4, 5];
  assert.equal(paginate(items, 99, 2).page, 3);
  assert.equal(paginate(items, 0, 2).page, 1);
  assert.equal(paginate(items, -4, 2).page, 1);
  assert.equal(paginate(items, 'abc', 2).page, 1);
});

test('paginate handles an empty list', () => {
  const empty = paginate([], 5, 8);
  assert.deepEqual({ rows: empty.rows, page: empty.page, pages: empty.pages, total: empty.total, from: empty.from, to: empty.to }, { rows: [], page: 1, pages: 1, total: 0, from: 0, to: 0 });
});

test('pageWindow lists every page when there are few', () => {
  assert.deepEqual(pageWindow(1, 1), [1]);
  assert.deepEqual(pageWindow(3, 7), [1, 2, 3, 4, 5, 6, 7]);
});

test('pageWindow collapses distant pages into gaps', () => {
  assert.deepEqual(pageWindow(6, 12), [1, '…', 5, 6, 7, '…', 12]);
  assert.deepEqual(pageWindow(1, 12), [1, 2, '…', 12]);
  assert.deepEqual(pageWindow(12, 12), [1, '…', 11, 12]);
  assert.deepEqual(pageWindow(3, 12), [1, 2, 3, 4, '…', 12]);
});
