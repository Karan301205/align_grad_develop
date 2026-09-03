const rateLimitConfig = require('../config/rateLimit.config');

// In-memory stores for request tracking and failed login backoffs
const ipStore = new Map();
const failedAttemptsStore = new Map();

/**
 * Standard fixed-window request rate limiter middleware
 */
const rateLimiter = (options) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const storeKey = `${req.path}:${ip}`;

    let record = ipStore.get(storeKey);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + options.windowMs
      };
      ipStore.set(storeKey, record);
    } else {
      record.count++;
    }

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > options.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: 'Too many requests. Please try again later.'
      });
    }

    next();
  };
};

/**
 * Middleware that checks lock status for login request (both IP and Email)
 */
const checkLoginLock = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { email } = req.body;
  const now = Date.now();

  // 1. Check IP lock
  const ipRecord = failedAttemptsStore.get(`ip:${ip}`);
  if (ipRecord && ipRecord.lockedUntil && now < ipRecord.lockedUntil) {
    const retryAfter = Math.ceil((ipRecord.lockedUntil - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: `Too many failed login attempts. Please wait ${retryAfter} second${retryAfter === 1 ? '' : 's'} before trying again.`
    });
  }

  // 2. Check Email lock
  if (email) {
    const emailKey = `email:${email.toLowerCase().trim()}`;
    const emailRecord = failedAttemptsStore.get(emailKey);
    if (emailRecord && emailRecord.lockedUntil && now < emailRecord.lockedUntil) {
      const retryAfter = Math.ceil((emailRecord.lockedUntil - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${retryAfter} seconds.`
      });
    }
  }

  next();
};

/**
 * Record a failed login attempt for both IP and Email, applying progressive/exponential backoff
 */
const recordFailedAttempt = (email, ip) => {
  const now = Date.now();
  const config = rateLimitConfig.auth.backoff;

  const recordAttempt = (key) => {
    let record = failedAttemptsStore.get(key);
    // If no record, or if the tracking reset window (30 mins) has fully passed, initialize fresh
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + 30 * 60 * 1000 // 30 minutes window to track failures
      };
    } else {
      record.count++;
      record.resetTime = now + 30 * 60 * 1000; // Extend reset time upon new failure
    }

    // Apply lock if threshold is reached
    if (record.count >= config.maxFailedAttempts) {
      const exponent = record.count - config.maxFailedAttempts;
      const delay = Math.min(
        config.baseDelayMs * Math.pow(config.multiplier, exponent),
        config.maxDelayMs
      );
      record.lockedUntil = now + delay;
    }

    failedAttemptsStore.set(key, record);
  };

  if (ip) recordAttempt(`ip:${ip}`);
  if (email) recordAttempt(`email:${email.toLowerCase().trim()}`);
};

/**
 * Reset failed attempts tracker on successful login
 */
const resetFailedAttempts = (email, ip) => {
  if (ip) failedAttemptsStore.delete(`ip:${ip}`);
  if (email) failedAttemptsStore.delete(`email:${email.toLowerCase().trim()}`);
};

// Periodic cleanup task to prevent memory leaks from old/inactive tracking states
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of ipStore.entries()) {
    if (now > value.resetTime) {
      ipStore.delete(key);
    }
  }
  for (const [key, value] of failedAttemptsStore.entries()) {
    const isIpRecord = key.startsWith('ip:');
    if (value.lockedUntil) {
      if (now > value.lockedUntil && now > value.resetTime) {
        failedAttemptsStore.delete(key);
      }
    } else if (now > value.resetTime) {
      failedAttemptsStore.delete(key);
    }
  }
}, 60 * 1000); // Runs every 1 minute

const authLimit = rateLimiter(rateLimitConfig.auth);
const relaxedLimit = rateLimiter(rateLimitConfig.relaxed);

module.exports = {
  rateLimiter,
  authLimit,
  relaxedLimit,
  checkLoginLock,
  recordFailedAttempt,
  resetFailedAttempts
};
