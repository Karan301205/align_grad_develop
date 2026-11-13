// Centralized error handler for the admin backend. The full error is always logged
// on the server. Users get a plain message: 4xx errors keep theirs (they describe
// what to fix); 5xx errors never expose internals. Outside production the technical
// message is also sent as `detail`, which the admin frontend prints to the browser
// console only.
module.exports = (err, req, res, next) => {
  console.error(`[ERROR EXCEPTION] ${req.method} ${req.originalUrl}:`, err.stack || err);

  const statusCode = err.status || err.statusCode || 500;

  if (statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Request failed'
    });
  }

  res.status(statusCode).json({
    success: false,
    error: 'Something went wrong on our side. Please try again in a moment.',
    ...(process.env.NODE_ENV === 'production' ? {} : { detail: err.message })
  });
};
