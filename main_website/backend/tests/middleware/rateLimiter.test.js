// Signed-in requests are limited per user, not per network address, so many people
// behind one campus or office address don't share a single limit.
const test = require('node:test');
const assert = require('node:assert');
const { rateLimiter } = require('../../src/middleware/rateLimiter');

function run(limit, req) {
  let status = 200;
  const res = {
    setHeader() {},
    status(code) { status = code; return this; },
    json() { return this; }
  };
  limit(req, res, () => {});
  return status;
}

test('each signed-in user on the same address gets their own limit', () => {
  const limit = rateLimiter({ windowMs: 60000, maxRequests: 2 });
  const from = (userId) => ({ ip: '10.0.0.1', path: '/g1/messages', headers: {}, socket: {}, user: userId ? { id: userId } : undefined });
  assert.deepStrictEqual([1, 2, 3].map(() => run(limit, from('user-a'))), [200, 200, 429]);
  assert.strictEqual(run(limit, from('user-b')), 200, 'another user on the same address is not blocked');
  assert.deepStrictEqual([1, 2, 3].map(() => run(limit, from(null))), [200, 200, 429], 'anonymous requests still count per address');
});
