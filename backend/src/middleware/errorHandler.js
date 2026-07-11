/**
 * Centralized Error Handling Middleware for Main Backend
 * Exposes generic errors in production, logs complete stack traces on server.
 */
const errorHandler = (err, req, res, next) => {
  // Log full error stack details on the server for debugging
  console.error('[ERROR EXCEPTION]:', err.stack || err);

  const statusCode = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // For 4xx validation or client-side errors, we can expose the message directly
  if (statusCode < 500) {
    return res.status(statusCode).json({
      error: err.message || 'Validation failed'
    });
  }

  // Mask 5xx internal system failures (like DB connection errors, S3 API crashes, type errors)
  const responseMessage = isProd
    ? 'An unexpected error occurred on the server. Please try again later.'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: responseMessage,
    ...(isProd ? {} : { stack: err.stack })
  });
};

module.exports = errorHandler;
