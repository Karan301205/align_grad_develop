// Signed-in requests are limited per user, not per network address, so many people
// behind one campus or office address don't share a single limit.
// With Redis, counts are shared by every server process; if Redis fails, memory takes over.
process.env.REDIS_URL = ''; // the memory tests must not reach a real Redis

const test = require('node:test');
const assert = require('node:assert');
const redisStore = require('../../src/infrastructure/redis');
const { rateLimiter, checkLoginLock, checkCodeLock, lockSignupCode, recordFailedAttempt, resetFailedAttempts } = require('../../src/middleware/rateLimiter');
const { runOncePer, pingRedis } = require('../../src/infrastructure/redis');

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

test('the health check reports Redis as not configured, working or not working', async () => {
  const { EventEmitter } = require('node:events');
  const client = (status, ping) => Object.assign(new EventEmitter(), { status, ping });
  assert.strictEqual(await pingRedis(50, null), null, 'no REDIS_URL');
  assert.strictEqual(await pingRedis(50, client('ready', async () => 'PONG')), true);
  assert.strictEqual(await pingRedis(50, client('ready', async () => { throw new Error('down'); })), false);
  assert.strictEqual(await pingRedis(50, client('ready', () => new Promise(() => {}))), false, 'no answer in time');
  const connecting = client('connecting', async () => 'PONG');
  assert.strictEqual(await pingRedis(50, connecting), false, 'never connected');
  assert.strictEqual(connecting.listenerCount('ready'), 0, 'no listener left behind');
  const late = client('connecting', async () => 'PONG');
  setTimeout(() => { late.status = 'ready'; late.emit('ready'); }, 10);
  assert.strictEqual(await pingRedis(200, late), true, 'connected while waiting');
});

// Status, message and Retry-After a lock check answered with (200 when it let the request through).
function lockAnswer(middleware, req) {
  return new Promise((resolve, reject) => {
    const res = {
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.code = code; return this; },
      json(body) { resolve({ status: this.code, error: body.error, retryAfter: this.headers['Retry-After'] }); return this; }
    };
    middleware(req, res, (err) => (err ? reject(err) : resolve({ status: 200 })));
  });
}
const loginFrom = (email, ip) => ({ ip, headers: {}, socket: {}, body: { email } });

test('5 wrong passwords lock that account for 10 minutes', async () => {
  for (let i = 0; i < 4; i += 1) await recordFailedAttempt('five@example.com', '10.0.1.1');
  assert.strictEqual((await lockAnswer(checkLoginLock, loginFrom('five@example.com', '10.0.1.1'))).status, 200, '4 wrong tries are still allowed');
  await recordFailedAttempt('five@example.com', '10.0.1.1');
  const locked = await lockAnswer(checkLoginLock, loginFrom('Five@Example.com', '10.0.1.2'));
  assert.strictEqual(locked.status, 429, 'locked from any network');
  assert.match(locked.error, /for this account\. Please try again in 10 minutes\./);
  assert.strictEqual(locked.retryAfter, 600);
  assert.strictEqual((await lockAnswer(checkLoginLock, loginFrom('other@example.com', '10.0.1.2'))).status, 200, 'other accounts are not affected');
});

test('one network address is locked only after 25 wrong passwords (a college shares one address)', async () => {
  for (let i = 0; i < 24; i += 1) await recordFailedAttempt(`student${i}@example.com`, '10.0.2.1');
  assert.strictEqual((await lockAnswer(checkLoginLock, loginFrom('new@example.com', '10.0.2.1'))).status, 200);
  await recordFailedAttempt('student24@example.com', '10.0.2.1');
  const locked = await lockAnswer(checkLoginLock, loginFrom('new@example.com', '10.0.2.1'));
  assert.strictEqual(locked.status, 429);
  assert.match(locked.error, /from this network/);
});

test('after the 10 minutes the account gets 5 fresh tries', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.now() });
  for (let i = 0; i < 5; i += 1) await recordFailedAttempt('again@example.com', '10.0.3.1');
  t.mock.timers.tick(9 * 60 * 1000);
  assert.match((await lockAnswer(checkLoginLock, loginFrom('again@example.com', '10.0.3.1'))).error, /in 1 minute\./);
  t.mock.timers.tick(60 * 1000);
  assert.strictEqual((await lockAnswer(checkLoginLock, loginFrom('again@example.com', '10.0.3.1'))).status, 200, 'lock over');
  await recordFailedAttempt('again@example.com', '10.0.3.1');
  assert.strictEqual((await lockAnswer(checkLoginLock, loginFrom('again@example.com', '10.0.3.1'))).status, 200, 'one more wrong try does not lock again');
});

test('a sign-up locked for wrong codes blocks every sign-up step for that email only', async () => {
  await lockSignupCode('Coder@Example.com');
  const locked = await lockAnswer(checkCodeLock, loginFrom('coder@example.com ', '10.0.4.1'));
  assert.strictEqual(locked.status, 429);
  assert.match(locked.error, /wrong verification codes for this email\. Please try again in 10 minutes\./);
  assert.strictEqual((await lockAnswer(checkCodeLock, loginFrom('someone-else@example.com', '10.0.4.1'))).status, 200);
  assert.strictEqual((await lockAnswer(checkLoginLock, loginFrom('coder@example.com', '10.0.4.1'))).status, 200, 'a sign-up lock is not a login lock');
});
