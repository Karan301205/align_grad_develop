// Admin request limits: in memory without Redis, shared through Redis with it, and back to memory
// if Redis stops answering. Plus the Redis line of GET /health. No real Redis or database is used.
process.env.REDIS_URL = '';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

const test = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const redisStore = require('../config/redis');
const { rateLimiter } = require('./rateLimiter');

// Resolves with the status the middleware chose (200 when it called next).
function run(middleware, req) {
  return new Promise((resolve, reject) => {
    const res = {
      setHeader() {},
      status(code) { this.code = code; return this; },
      json() { resolve(this.code); return this; }
    };
    middleware(req, res, (err) => (err ? reject(err) : resolve(200)));
  });
}

function fakeRedis() {
  const counts = new Map();
  const expires = new Map();
  return {
    counts,
    multi() {
      const ops = [];
      const chain = {
        incr(key) { ops.push(['incr', key]); return chain; },
        pttl(key) { ops.push(['pttl', key]); return chain; },
        exec: async () => ops.map(([op, key]) => (op === 'incr'
          ? [null, (counts.set(key, (counts.get(key) || 0) + 1), counts.get(key))]
          : [null, expires.has(key) ? expires.get(key) - Date.now() : -1]))
      };
      return chain;
    },
    pexpire: async (key, ms) => { expires.set(key, Date.now() + ms); return 1; }
  };
}

const request = (path) => ({ ip: '10.1.1.1', path, headers: {}, socket: {} });

test('without Redis each process counts in memory', async () => {
  const limit = rateLimiter({ windowMs: 60000, maxRequests: 2 });
  assert.deepStrictEqual([await run(limit, request('/m')), await run(limit, request('/m')), await run(limit, request('/m'))], [200, 200, 429]);
});

test('with Redis two admin server processes share one count', async (t) => {
  const redis = fakeRedis();
  t.mock.method(redisStore, 'getRedis', () => redis);
  const serverA = rateLimiter({ windowMs: 60000, maxRequests: 2 });
  const serverB = rateLimiter({ windowMs: 60000, maxRequests: 2 });
  assert.deepStrictEqual([await run(serverA, request('/s')), await run(serverB, request('/s')), await run(serverA, request('/s'))], [200, 200, 429]);
  assert.strictEqual(redis.counts.get('rl:/s:10.1.1.1'), 3, 'the client adds the admin: prefix itself');
});

test('if Redis stops answering, the limit still applies from memory', async (t) => {
  const broken = { multi: () => ({ incr() { return this; }, pttl() { return this; }, exec: async () => { throw new Error('connection lost'); } }) };
  t.mock.method(redisStore, 'getRedis', () => broken);
  const limit = rateLimiter({ windowMs: 60000, maxRequests: 1 });
  assert.deepStrictEqual([await run(limit, request('/f')), await run(limit, request('/f'))], [200, 429]);
});

test('the health check reports Redis as not configured, working or not working', async () => {
  const client = (status, ping) => Object.assign(new EventEmitter(), { status, ping });
  assert.strictEqual(await redisStore.pingRedis(50, null), null);
  assert.strictEqual(await redisStore.pingRedis(50, client('ready', async () => 'PONG')), true);
  assert.strictEqual(await redisStore.pingRedis(50, client('ready', async () => { throw new Error('down'); })), false);
  const connecting = client('connecting', async () => 'PONG');
  assert.strictEqual(await redisStore.pingRedis(50, connecting), false);
  assert.strictEqual(connecting.listenerCount('ready'), 0, 'no listener left behind');
});

test('admin keys are kept apart from the main site\'s', () => {
  assert.strictEqual(redisStore.KEY_PREFIX, 'admin:');
});
