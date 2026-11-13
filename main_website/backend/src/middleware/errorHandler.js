/**
 * Centralized error handler for the main backend.
 * The full error is always logged on the server. Users get a plain message: 4xx
 * errors keep theirs (they describe what to fix); 5xx errors never expose internals.
 * Outside production the technical message is also sent as `detail`, which the
 * frontend prints to the browser console only.
 */
const errorHandler = (err, req, res, next) => {
  // Prisma P2023 ("inconsistent column data") is raised for malformed id/column values
  if (err.code === 'P2023') {
    return res.status(400).json({
      error: 'Invalid ID format provided.'
    });
  }

  console.error(`[ERROR EXCEPTION] ${req.method} ${req.originalUrl}:`, err.stack || err);

  const statusCode = err.statusCode || err.status || 500;

  if (statusCode < 500) {
    return res.status(statusCode).json({
      error: err.message || 'Validation failed'
    });
  }

  res.status(statusCode).json({
    error: 'Something went wrong on our side. Please try again in a moment.',
    ...(process.env.NODE_ENV === 'production' ? {} : { detail: err.message })
  });
};

module.exports = errorHandler;
