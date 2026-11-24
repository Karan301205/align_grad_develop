/**
 * Centralized Rate Limiting Configuration
 * Supports customization via environment variables without editing the source code.
 */
module.exports = {
  // Strict limits (Auth endpoints: login, signup)
  auth: {
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 200, // 200 requests per IP per window
    // Failed login backoff settings
    backoff: {
      maxFailedAttempts: parseInt(process.env.AUTH_BACKOFF_MAX_FAILED_ATTEMPTS) || 10, // Lock starts after 10 failed attempts
      baseDelayMs: parseInt(process.env.AUTH_BACKOFF_BASE_DELAY_MS) || 3000, // 3 seconds initial lock
      multiplier: parseFloat(process.env.AUTH_BACKOFF_MULTIPLIER) || 2, // Exponential backoff multiplier: 3s, 6s, 12s...
      maxDelayMs: parseInt(process.env.AUTH_BACKOFF_MAX_DELAY_MS) || 15 * 60 * 1000 // Max lock 15 minutes
    }
  },
  // Routes that send an email (sign-up code, code resend, password reset), counted together per
  // network address, so one machine can't make us mail hundreds of addresses and use up the
  // SMTP quota. Each address also has its own limits in the database (auth/services).
  // A campus signing up together shares one address: raise this for a placement drive.
  email: {
    windowMs: parseInt(process.env.RATE_LIMIT_EMAIL_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_EMAIL_MAX_REQUESTS) || 50,
    bucket: 'email-send'
  },
  // Costly actions per signed-in user: starting a skill test, creating a payment order.
  costly: {
    windowMs: parseInt(process.env.RATE_LIMIT_COSTLY_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
    maxRequests: parseInt(process.env.RATE_LIMIT_COSTLY_MAX_REQUESTS) || 30
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
