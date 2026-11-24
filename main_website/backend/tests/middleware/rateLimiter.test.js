// Signed-in requests are limited per user, not per network address, so many people
// behind one campus or office address don't share a single limit.
// With Redis, counts are shared by every server process; if Redis fails, memory takes over.
process.env.REDIS_URL = ''; // the memory tests must not reach a real Redis

const test = require('node:test');
const assert = require('node:assert');
const redisStore = require('../../src/infrastructure/redis');
const { rateLimiter, checkLoginLock, recordFailedAttempt, resetFailedAttempts } = require('../../src/middleware/rateLimiter');
const { runOncePer } = require('../../src/infrastructure/redis');

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

// A tiny stand-in for the Redis commands the limiter uses.
function fakeRedis() {
  const data = new Map();
  const expires = new Map();
  const chain = (ops) => ({
    incr(key) { ops.push(['incr', key]); return this; },
    pttl(key) { ops.push(['pttl', key]); return this; },
    exec: async () => ops.map(([op, key]) => (op === 'incr'
      ? [null, (data.set(key, (data.get(key) || 0) + 1), data.get(key))]
      : [null, expires.has(key) ? expires.get(key) - Date.now() : -1]))
  });
  return {
    data,
    multi: () => chain([]),
    pexpire: async (key, ms) => { expires.set(key, Date.now() + ms); return 1; },
    get: async (key) => (data.has(key) ? data.get(key) : null),
    mget: async (keys) => keys.map((key) => (data.has(key) ? data.get(key) : null)),
    set: async (key, value, ...args) => {
      if (args.includes('NX') && data.has(key)) return null;
      data.set(key, value);
      return 'OK';
    },
    del: async (keys) => { keys.forEach((key) => data.delete(key)); return keys.length; }
  };
}

// Runs async middleware and resolves with the status it chose (200 when it called next).
function runAsync(middleware, req) {
  return new Promise((resolve, reject) => {
    const res = {
      setHeader() {},
      status(code) { this.code = code; return this; },
      json() { resolve(this.code); return this; }
    };
    middleware(req, res, (err) => (err ? reject(err) : resolve(200)));
  });
}

test('with Redis, two server processes share one count', async (t) => {
  const redis = fakeRedis();
  t.mock.method(redisStore, 'getRedis', () => redis);
  const serverA = rateLimiter({ windowMs: 60000, maxRequests: 2 });
  const serverB = rateLimiter({ windowMs: 60000, maxRequests: 2 });
  const req = { ip: '10.0.0.2', path: '/jobs', headers: {}, socket: {}, user: { id: 'u-shared' } };
  assert.deepStrictEqual([await runAsync(serverA, req), await runAsync(serverB, req), await runAsync(serverA, req)], [200, 200, 429]);
  assert.strictEqual(redis.data.get('rl:/jobs:user:u-shared'), 3);
});

test('if Redis stops answering, the limit still applies from memory', async (t) => {
  const broken = { multi: () => ({ incr() { return this; }, pttl() { return this; }, exec: async () => { throw new Error('connection lost'); } }) };
  t.mock.method(redisStore, 'getRedis', () => broken);
  const limit = rateLimiter({ windowMs: 60000, maxRequests: 1 });
  const req = { ip: '10.0.0.3', path: '/fallback', headers: {}, socket: {} };
  assert.deepStrictEqual([await runAsync(limit, req), await runAsync(limit, req)], [200, 429]);
});

test('failed logins recorded through Redis lock the account on every server, and a good login clears it', async (t) => {
  const redis = fakeRedis();
  t.mock.method(redisStore, 'getRedis', () => redis);
  const login = { ip: '10.0.0.4', headers: {}, socket: {}, body: { email: 'Someone@Example.com ' } };
  for (let i = 0; i < 10; i += 1) await recordFailedAttempt('someone@example.com', '10.0.0.4');
  assert.strictEqual(await runAsync(checkLoginLock, login), 429);
  await resetFailedAttempts('someone@example.com', '10.0.0.4');
  assert.strictEqual(await runAsync(checkLoginLock, login), 200);
});

test('a scheduled job runs on one server per window with Redis, and everywhere without it', async () => {
  const redis = fakeRedis();
  assert.strictEqual(await runOncePer('job-retention', 60000, redis), true);
  assert.strictEqual(await runOncePer('job-retention', 60000, redis), false, 'another process already has this hour');
  assert.strictEqual(await runOncePer('job-retention', 60000, null), true, 'no Redis: run');
  const broken = { set: async () => { throw new Error('down'); } };
  assert.strictEqual(await runOncePer('job-retention', 60000, broken), true, 'Redis down: run (safe to repeat)');
});

test('routes with a shared bucket share one count (sign-up, resend and reset emails)', () => {
  const emails = rateLimiter({ windowMs: 60000, maxRequests: 2, bucket: 'email-send-test' });
  const at = (path) => ({ ip: '10.0.0.9', path, headers: {}, socket: {} });
  assert.deepStrictEqual([run(emails, at('/signup/initiate')), run(emails, at('/forgot-password')), run(emails, at('/signup/resend-pin'))], [200, 200, 429]);
});
