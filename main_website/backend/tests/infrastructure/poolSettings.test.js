// Connection-pool settings added to the running server's database URL.
const test = require('node:test');
const assert = require('node:assert');
const { withPoolSettings } = require('../../src/infrastructure/database/poolSettings');

const BASE = 'postgresql://app%40x:p%26ss%23@db.example:5432/my%20db?schema=align_grap_test';

test('defaults are added and encoded credentials are kept', () => {
  const url = new URL(withPoolSettings(BASE, {}));
  assert.strictEqual(url.username, 'app%40x');
  assert.strictEqual(url.password, 'p%26ss%23');
  assert.strictEqual(url.searchParams.get('schema'), 'align_grap_test');
  assert.strictEqual(url.searchParams.get('connection_limit'), '10');
  assert.strictEqual(url.searchParams.get('pool_timeout'), '10');
  assert.strictEqual(url.searchParams.has('pgbouncer'), false);
});

test('env values are used, values already in the URL win, bad numbers fall back', () => {
  const url = new URL(withPoolSettings(`${BASE}&connection_limit=3`, { DB_CONNECTION_LIMIT: '25', DB_POOL_TIMEOUT: 'soon' }));
  assert.strictEqual(url.searchParams.get('connection_limit'), '3');
  assert.strictEqual(url.searchParams.get('pool_timeout'), '10');
});

test('DB_POOLER_PORT switches to PgBouncer on the same host', () => {
  const url = new URL(withPoolSettings(BASE, { DB_POOLER_PORT: '6432' }));
  assert.strictEqual(url.hostname, 'db.example');
  assert.strictEqual(url.port, '6432');
  assert.strictEqual(url.searchParams.get('pgbouncer'), 'true');
});

test('empty or unreadable URLs are passed through untouched', () => {
  assert.strictEqual(withPoolSettings('', {}), '');
  assert.strictEqual(withPoolSettings('not a url', {}), 'not a url');
});
