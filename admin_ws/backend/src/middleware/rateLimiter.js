const redisStore = require('../config/redis');

// Window-based request limits. With REDIS_URL set the counts live in Redis (key
// admin:rl:<path>:<ip>), so every admin server process sees the same totals and a restart doesn't
// reset them. Without Redis, or while Redis can't answer, each process counts in its own memory.

const ipStore = new Map();

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
 * Standard window-based rate limiter middleware
 */
const rateLimiter = (options) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const storeKey = `${req.path}:${ip}`;

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

// Periodic cleanup of this process's memory counts (the Redis keys expire on their own).
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of ipStore.entries()) {
    if (now > value.resetTime) {
      ipStore.delete(key);
    }
  }
}, 60 * 1000); // run every 1 minute
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

module.exports = {
  rateLimiter
};
