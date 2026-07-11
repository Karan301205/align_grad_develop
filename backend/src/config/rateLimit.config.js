/**
 * Centralized Rate Limiting Configuration
 * Supports customization via environment variables without editing the source code.
 */
module.exports = {
  // Strict limits (Auth endpoints: login, signup)
  auth: {
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 100, // 100 requests per IP per window
    // Failed login backoff settings
    backoff: {
      maxFailedAttempts: parseInt(process.env.AUTH_BACKOFF_MAX_FAILED_ATTEMPTS) || 3, // Lock starts after 3 failed attempts
      baseDelayMs: parseInt(process.env.AUTH_BACKOFF_BASE_DELAY_MS) || 5000, // 5 seconds initial lock
      multiplier: parseFloat(process.env.AUTH_BACKOFF_MULTIPLIER) || 3, // Exponential backoff multiplier: 5s, 15s, 45s, 135s...
      maxDelayMs: parseInt(process.env.AUTH_BACKOFF_MAX_DELAY_MS) || 24 * 60 * 60 * 1000 // Max lock 24 hours
    }
  },
  // Moderate limits (Public / future general endpoints)
  moderate: {
    windowMs: parseInt(process.env.RATE_LIMIT_MODERATE_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MODERATE_MAX_REQUESTS) || 150
  },
  // Relaxed limits (Authenticated endpoints)
  relaxed: {
    windowMs: parseInt(process.env.RATE_LIMIT_RELAXED_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_RELAXED_MAX_REQUESTS) || 1000
  }
};
