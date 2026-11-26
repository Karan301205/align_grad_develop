/**
 * Centralized Rate Limiting Configuration
 * Supports customization via environment variables without editing the source code.
 */
module.exports = {
  // Strict limits (Auth endpoints: login, signup)
  auth: {
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 200, // 200 requests per IP per window
    // Failed sign-ins: after `maxFailedAttempts` wrong tries for one email, signing in to it is
    // locked for `lockMs`, then the count starts over. One network address is locked after
    // `ipMaxFailedAttempts` (higher, because a whole college or office can share one address).
    // A sign-up whose emailed code was guessed wrong 5 times is locked for `lockMs` too.
    backoff: {
      maxFailedAttempts: parseInt(process.env.AUTH_BACKOFF_MAX_FAILED_ATTEMPTS) || 5,
      ipMaxFailedAttempts: parseInt(process.env.AUTH_BACKOFF_IP_MAX_FAILED_ATTEMPTS) || 25,
      lockMs: parseInt(process.env.AUTH_BACKOFF_LOCK_MS) || 10 * 60 * 1000 // 10 minutes
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
