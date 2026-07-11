// In-memory store for tracking request counts
const ipStore = new Map();

/**
 * Standard window-based rate limiter middleware
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

// Periodic memory cleanup task to prevent leakages
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of ipStore.entries()) {
    if (now > value.resetTime) {
      ipStore.delete(key);
    }
  }
}, 60 * 1000); // run every 1 minute

module.exports = {
  rateLimiter
};
