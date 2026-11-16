import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatDateTime, plural, safeUrl, usd, isEmail } from './format.js';

test('formatDate formats valid dates and returns "" for missing or invalid ones', () => {
  assert.match(formatDate('2026-11-12T10:00:00.000Z'), /2026/);
  assert.match(formatDate('2026-11-12T10:00:00.000Z'), /Nov/);
  assert.equal(formatDate(''), '');
  assert.equal(formatDate(null), '');
  assert.equal(formatDate('not a date'), '');
});

test('formatDateTime includes the year and handles bad input', () => {
  assert.match(formatDateTime('2026-11-12T10:00:00.000Z'), /2026/);
  assert.equal(formatDateTime(undefined), '');
  assert.equal(formatDateTime('nope'), '');
});

test('plural picks the singular only for exactly one', () => {
  assert.equal(plural(1, 'candidate'), '1 candidate');
  assert.equal(plural(0, 'candidate'), '0 candidates');
  assert.equal(plural(2, 'candidate'), '2 candidates');
  assert.equal(plural(2, 'company', 'companies'), '2 companies');
});

test('safeUrl keeps web addresses and drops every other scheme', () => {
  assert.equal(safeUrl('https://example.com/a?b=1'), 'https://example.com/a?b=1');
  assert.equal(safeUrl('  http://example.com '), 'http://example.com');
  assert.equal(safeUrl('HTTPS://EXAMPLE.COM'), 'HTTPS://EXAMPLE.COM');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl(' JavaScript:alert(1)'), '');
  assert.equal(safeUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(safeUrl('//evil.example.com'), '');
  assert.equal(safeUrl('example.com'), '');
  assert.equal(safeUrl(null), '');
  assert.equal(safeUrl(undefined), '');
});

test('usd formats with a dollar sign and tolerates bad numbers', () => {
  assert.equal(usd(0.0123456), '$0.0123');
  assert.equal(usd(2, 2), '$2.00');
  assert.equal(usd(undefined), '$0.0000');
  assert.equal(usd('abc'), '$0.0000');
});

test('isEmail accepts ordinary addresses and rejects anything that could change a mailto link', () => {
  assert.equal(isEmail('hr@company.com'), true);
  assert.equal(isEmail(' hr@company.co.in '), true);
  assert.equal(isEmail('a.b+c@sub.example.org'), true);
  assert.equal(isEmail('no-at-sign.com'), false);
  assert.equal(isEmail('two@@signs.com'), false);
  assert.equal(isEmail('spaces in@x.com'), false);
  assert.equal(isEmail('x@nodot'), false);
  assert.equal(isEmail('a@b.com?cc=evil@x.com'.replace('?', ' ')), false);
  assert.equal(isEmail('<script>@x.com'), false);
  assert.equal(isEmail(''), false);
  assert.equal(isEmail(null), false);
});
