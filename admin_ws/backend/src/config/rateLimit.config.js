/**
 * Centralized Rate Limiting Configuration for Admin Portal Backend
 */
module.exports = {
  // Relaxed limits for administrative APIs
  relaxed: {
    windowMs: parseInt(process.env.RATE_LIMIT_RELAXED_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_RELAXED_MAX_REQUESTS) || 1000 // 1000 requests per IP per window
  }
};
