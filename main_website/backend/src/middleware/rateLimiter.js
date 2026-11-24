const rateLimitConfig = require('../config/rateLimit.config');
const redisStore = require('../infrastructure/redis');

// Request limits and failed-login backoff.
//
// With REDIS_URL set the counts live in Redis, so every server process sees the same totals
// and a restart doesn't reset them. Without Redis, or while Redis can't answer, each process
// counts in its own memory (correct for a single process). Redis keys: rl:<path>:<who> for
// request windows, auth-fail:<ip|email>:<value> for failed logins.

const ipStore = new Map();
const failedAttemptsStore = new Map();
const FAILURE_WINDOW_MS = 30 * 60 * 1000; // failed logins are remembered this long after the last one

const clientIp = (req) => req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

/* ------------------------------------------------------------- request limits */

function memoryHit(key, windowMs) {
  const now = Date.now();
  let record = ipStore.get(key);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    ipStore.set(key, record);
  } else {
    record.count++;
  }
  return record;
}

async function redisHit(redis, key, windowMs) {
  const [[countError, count], [ttlError, ttl]] = await redis.multi().incr(key).pttl(key).exec();
  if (countError || ttlError) throw countError || ttlError;
  let remaining = ttl;
  if (remaining < 0) {
    // First request of the window (or a key left without an expiry): start the window now.
    await redis.pexpire(key, windowMs);
    remaining = windowMs;
  }
  return { count, resetTime: Date.now() + remaining };
}

/**
 * Standard fixed-window request rate limiter middleware. Counts per route, or per `bucket`
 * when several routes share one count.
 */
const rateLimiter = (options) => {
  return (req, res, next) => {
    // Signed-in requests (the limiter runs after auth) count per user, so a class or
    // office sharing one network address doesn't share one limit; the rest per IP.
    const storeKey = `${options.bucket || req.path}:${req.user && req.user.id ? `user:${req.user.id}` : `ip:${clientIp(req)}`}`;

    const apply = (record) => {
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

      if (record.count > options.maxRequests) {
        const retryAfter = Math.max(1, Math.ceil((record.resetTime - Date.now()) / 1000));
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: 'Too many requests. Please try again later.'
        });
      }
      return next();
    };

    const redis = redisStore.getRedis();
    if (!redis) return apply(memoryHit(storeKey, options.windowMs));
    redisHit(redis, `rl:${storeKey}`, options.windowMs)
      .catch((err) => {
        redisStore.reportFallback('rate limit', err);
        return memoryHit(storeKey, options.windowMs);
      })
      .then(apply)
      .catch(next);
  };
};

/* ---------------------------------------------------------- failed logins */

const failureKeys = (email, ip) => [ip && `ip:${ip}`, email && `email:${String(email).toLowerCase().trim()}`].filter(Boolean);

/** The record after one more failed attempt, with a lock once the threshold is reached. */
function withFailure(record, now = Date.now()) {
  const config = rateLimitConfig.auth.backoff;
  // If no record, or if the tracking window has fully passed, start fresh
  const next = !record || now > record.resetTime
    ? { count: 1, resetTime: now + FAILURE_WINDOW_MS }
    : { ...record, count: record.count + 1, resetTime: now + FAILURE_WINDOW_MS };

  if (next.count >= config.maxFailedAttempts) {
    const exponent = next.count - config.maxFailedAttempts;
    const delay = Math.min(config.baseDelayMs * Math.pow(config.multiplier, exponent), config.maxDelayMs);
    next.lockedUntil = now + delay;
  }
  return next;
}

const parseRecord = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

/** Records for `keys` from Redis, or from this process's memory without Redis. */
async function readFailures(keys) {
  const redis = redisStore.getRedis();
  if (!redis || keys.length === 0) return keys.map((key) => failedAttemptsStore.get(key));
  try {
    return (await redis.mget(keys.map((key) => `auth-fail:${key}`))).map(parseRecord);
  } catch (err) {
    redisStore.reportFallback('login backoff', err);
    return keys.map((key) => failedAttemptsStore.get(key));
  }
}

/**
 * Middleware that checks lock status for login request (both IP and Email)
 */
const checkLoginLock = (req, res, next) => {
  const ip = clientIp(req);
  const { email } = req.body;
  const keys = failureKeys(email, ip);

  const decide = ([ipRecord, emailRecord]) => {
    const now = Date.now();
    // 1. Check IP lock
    if (ipRecord && ipRecord.lockedUntil && now < ipRecord.lockedUntil) {
      const retryAfter = Math.ceil((ipRecord.lockedUntil - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: `Too many failed login attempts. Please wait ${retryAfter} second${retryAfter === 1 ? '' : 's'} before trying again.`
      });
    }
    // 2. Check Email lock
    if (emailRecord && emailRecord.lockedUntil && now < emailRecord.lockedUntil) {
      const retryAfter = Math.ceil((emailRecord.lockedUntil - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${retryAfter} seconds.`
      });
    }
    return next();
  };

  // keys is [ip, email] (either may be missing); line the records up with that shape.
  const shape = (records) => (ip ? records : [undefined, ...records]);
  if (!redisStore.getRedis()) return decide(shape(keys.map((key) => failedAttemptsStore.get(key))));
  readFailures(keys).then((records) => decide(shape(records))).catch(next);
};

/**
 * Record a failed login attempt for both IP and Email, applying progressive/exponential backoff.
 * Callers don't wait for it; with Redis it finishes in the background and never throws.
 */
const recordFailedAttempt = (email, ip) => {
  const keys = failureKeys(email, ip);
  const redis = redisStore.getRedis();
  if (!redis) {
    keys.forEach((key) => failedAttemptsStore.set(key, withFailure(failedAttemptsStore.get(key))));
    return Promise.resolve();
  }
  return Promise.all(keys.map(async (key) => {
    try {
      const record = withFailure(parseRecord(await redis.get(`auth-fail:${key}`)));
      const keepMs = Math.max(record.resetTime, record.lockedUntil || 0) - Date.now();
      await redis.set(`auth-fail:${key}`, JSON.stringify(record), 'PX', Math.max(1000, keepMs));
    } catch (err) {
      redisStore.reportFallback('login backoff', err);
      failedAttemptsStore.set(key, withFailure(failedAttemptsStore.get(key)));
    }
  }));
};

/**
 * Reset failed attempts tracker on successful login
 */
const resetFailedAttempts = (email, ip) => {
  const keys = failureKeys(email, ip);
  keys.forEach((key) => failedAttemptsStore.delete(key));
  const redis = redisStore.getRedis();
  if (!redis || keys.length === 0) return Promise.resolve();
  return redis.del(keys.map((key) => `auth-fail:${key}`)).catch((err) => redisStore.reportFallback('login backoff', err));
};

// Periodic cleanup of this process's memory counts (the Redis keys expire on their own).
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of ipStore.entries()) {
    if (now > value.resetTime) {
      ipStore.delete(key);
    }
  }
  for (const [key, value] of failedAttemptsStore.entries()) {
    if (value.lockedUntil) {
      if (now > value.lockedUntil && now > value.resetTime) {
        failedAttemptsStore.delete(key);
      }
    } else if (now > value.resetTime) {
      failedAttemptsStore.delete(key);
    }
  }
}, 60 * 1000).unref(); // Runs every 1 minute; never keeps the process alive on its own

const authLimit = rateLimiter(rateLimitConfig.auth);
const relaxedLimit = rateLimiter(rateLimitConfig.relaxed);
const emailLimit = rateLimiter(rateLimitConfig.email);
const costlyLimit = rateLimiter(rateLimitConfig.costly);

module.exports = {
  rateLimiter,
  authLimit,
  relaxedLimit,
  emailLimit,
  costlyLimit,
  checkLoginLock,
  recordFailedAttempt,
  resetFailedAttempts
};
