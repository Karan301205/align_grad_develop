const Redis = require('ioredis');
const env = require('./env');

// Optional Redis for the Admin Portal: request limits shared by every admin server process, and
// the Redis line in GET /health. Kept separate from main_website's copy (admin_ws isolation rule).
//
// Without REDIS_URL getRedis() returns null and the rate limiter counts in this process's memory,
// which is right for one process. With REDIS_URL set, commands fail fast while Redis is
// unreachable, so callers fall back instead of waiting. Every key starts with "admin:", so the
// admin portal and the main site can share one Redis server without mixing their counts.

const KEY_PREFIX = 'admin:';

let client = null;
let lastError = '';

function getRedis() {
  if (!env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(env.REDIS_URL, { keyPrefix: KEY_PREFIX, enableOfflineQueue: false, maxRetriesPerRequest: 1, connectTimeout: 5000 });
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
 * For GET /health: null when REDIS_URL isn't set, true when Redis answers PING within `ms`,
 * false otherwise. Never throws. `redis` can be passed in tests.
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

module.exports = { getRedis, pingRedis, reportFallback, closeRedis, KEY_PREFIX };
