const rateLimitConfig = require('../config/rateLimit.config');
const redisStore = require('../infrastructure/redis');

// Request limits, failed-login locks and sign-up code locks.
//
// With REDIS_URL set the counts live in Redis, so every server process sees the same totals
// and a restart doesn't reset them. Without Redis, or while Redis can't answer, each process
// counts in its own memory (correct for a single process). Redis keys: rl:<path>:<who> for
// request windows, auth-fail:<ip|email|code>:<value> for failed logins and sign-up codes.

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

/* ----------------------------------------------- failed sign-ins and sign-up codes */

const emailKey = (email) => String(email).toLowerCase().trim();
const failureKeys = (email, ip) => [ip && `ip:${ip}`, email && `email:${emailKey(email)}`].filter(Boolean);
const codeKeys = (email) => (email ? [`code:${emailKey(email)}`] : []);

/** The record after one more failed sign-in, locked once the key's limit is reached. */
function withFailure(key, record, now = Date.now()) {
  const { maxFailedAttempts, ipMaxFailedAttempts, lockMs } = rateLimitConfig.auth.backoff;
  // Start over when there's no record, the last failure was long ago, or an earlier lock has ended.
  const fresh = !record || now > record.resetTime || (record.lockedUntil && now >= record.lockedUntil);
  const next = { count: fresh ? 1 : record.count + 1, resetTime: now + FAILURE_WINDOW_MS };
  if (next.count >= (key.startsWith('ip:') ? ipMaxFailedAttempts : maxFailedAttempts)) next.lockedUntil = now + lockMs;
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

/** Replaces each key's record with `nextRecord(key, oldRecord)`. Never throws. */
function updateFailures(keys, nextRecord) {
  const redis = redisStore.getRedis();
  if (!redis) {
    keys.forEach((key) => failedAttemptsStore.set(key, nextRecord(key, failedAttemptsStore.get(key))));
    return Promise.resolve();
  }
  return Promise.all(keys.map(async (key) => {
    try {
      const record = nextRecord(key, parseRecord(await redis.get(`auth-fail:${key}`)));
      const keepMs = Math.max(record.resetTime, record.lockedUntil || 0) - Date.now();
      await redis.set(`auth-fail:${key}`, JSON.stringify(record), 'PX', Math.max(1000, keepMs));
    } catch (err) {
      redisStore.reportFallback('login backoff', err);
      failedAttemptsStore.set(key, nextRecord(key, failedAttemptsStore.get(key)));
    }
  }));
}

const LOCK_MESSAGES = {
  ip: 'Too many failed sign-in attempts from this network.',
  email: 'Too many failed sign-in attempts for this account.',
  code: 'Too many wrong verification codes for this email.'
};

/** "10 minutes", "1 minute", "45 seconds". */
function waitText(ms) {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/** Middleware answering 429 while any of the request's keys is locked. */
const lockCheck = (keysOf) => (req, res, next) => {
  const keys = keysOf(req);
  const decide = (records) => {
    const now = Date.now();
    const index = records.findIndex((record) => record?.lockedUntil && now < record.lockedUntil);
    if (index === -1) return next();
    const waitMs = records[index].lockedUntil - now;
    res.setHeader('Retry-After', Math.ceil(waitMs / 1000));
    return res.status(429).json({ error: `${LOCK_MESSAGES[keys[index].split(':')[0]]} Please try again in ${waitText(waitMs)}.` });
  };
  if (!redisStore.getRedis()) return decide(keys.map((key) => failedAttemptsStore.get(key)));
  readFailures(keys).then(decide).catch(next);
};

/** Login: blocked while this network address or this email is locked. */
const checkLoginLock = lockCheck((req) => failureKeys(req.body?.email, clientIp(req)));

/** Sign-up (start, verify, resend): blocked while this email's sign-up is locked. */
const checkCodeLock = lockCheck((req) => codeKeys(req.body?.email));

/**
 * Records a failed sign-in for the address and the email. Callers don't wait for it; with
 * Redis it finishes in the background and never throws.
 */
const recordFailedAttempt = (email, ip) => updateFailures(failureKeys(email, ip), withFailure);

/** Locks sign-up for `email` after its emailed code was guessed wrong too many times. */
const lockSignupCode = (email) => updateFailures(codeKeys(email), () => {
  const lockedUntil = Date.now() + rateLimitConfig.auth.backoff.lockMs;
  return { count: 0, resetTime: lockedUntil, lockedUntil };
});

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
  checkCodeLock,
  lockSignupCode,
  recordFailedAttempt,
  resetFailedAttempts
};
