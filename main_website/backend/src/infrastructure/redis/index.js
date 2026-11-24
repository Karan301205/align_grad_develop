const Redis = require('ioredis');
const env = require('../../config/env');

// Shared Redis connection for state every server process must see the same way: rate-limit
// counters, failed-login backoff, and "run once" locks for scheduled jobs. (The email queue
// keeps its own BullMQ connections, see infrastructure/email/emailQueue.js.)
//
// Optional: without REDIS_URL getRedis() returns null and callers keep their in-process
// fallback, which is correct for a single server process. With REDIS_URL set, commands fail
// fast while Redis is unreachable, so callers fall back instead of waiting.

let client = null;
let lastError = '';

function getRedis() {
  if (!env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(env.REDIS_URL, { enableOfflineQueue: false, maxRetriesPerRequest: 1, connectTimeout: 5000 });
    client.on('error', (err) => {
      // The client retries in the background and reports each attempt; log a repeated message once.
      const message = err?.message || String(err);
      if (message === lastError) return;
      lastError = message;
      console.error(`[redis] ${message}`);
    });
    client.on('ready', () => {
      lastError = '';
    });
  }
  return client;
}

/** Logs a failed Redis command once per message, for callers that then fall back. */
function reportFallback(what, err) {
  const message = `${what}: ${err?.message || err}`;
  if (message === lastError) return;
  lastError = message;
  console.error(`[redis] ${message} (using this process's own count meanwhile)`);
}

/**
 * True when this process should run a scheduled job now. With Redis, only the first process
 * to ask in each `ttlMs` window gets true (SET NX PX), so a job runs once across all servers.
 * Without Redis, or if Redis can't answer, it returns true: the jobs are safe to repeat.
 * `redis` can be passed in tests.
 */
async function runOncePer(name, ttlMs, redis = getRedis()) {
  if (!redis) return true;
  try {
    return (await redis.set(`lock:${name}`, String(process.pid), 'PX', ttlMs, 'NX')) === 'OK';
  } catch (err) {
    reportFallback(`could not take the ${name} lock`, err);
    return true;
  }
}

/** Resolves true once `redis` is connected, false if that takes longer than `ms`. */
function waitUntilReady(redis, ms) {
  if (redis.status === 'ready') return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (ready) => {
      clearTimeout(timer);
      redis.off('ready', onReady);
      resolve(ready);
    };
    const onReady = () => finish(true);
    const timer = setTimeout(() => finish(false), ms);
    redis.on('ready', onReady);
  });
}

/**
 * For GET /health: null when REDIS_URL isn't set, true when Redis answers PING within
 * `ms`, false otherwise. Never throws. `redis` can be passed in tests.
 */
async function pingRedis(ms = 1000, redis = getRedis()) {
  if (!redis) return null;
  try {
    if (!(await waitUntilReady(redis, ms))) return false;
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve('timeout'), ms);
    });
    const answer = await Promise.race([redis.ping(), timeout]).finally(() => clearTimeout(timer));
    return answer === 'PONG';
  } catch {
    return false;
  }
}

async function closeRedis() {
  if (!client) return;
  const closing = client;
  client = null;
  await closing.quit().catch(() => closing.disconnect());
}

module.exports = { getRedis, runOncePer, pingRedis, reportFallback, closeRedis };
