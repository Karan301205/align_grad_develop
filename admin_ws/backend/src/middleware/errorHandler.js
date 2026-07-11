module.exports = (err, req, res, next) => {
  // Log full error stack details on the server for debugging
  console.error('[ERROR EXCEPTION]:', err.stack || err);

  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // For 4xx client-side errors, we can expose the message directly
  if (statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Request failed'
    });
  }

  // Mask 5xx internal server exceptions in production
  const responseMessage = isProd
    ? 'An unexpected error occurred on the server. Please try again later.'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: responseMessage,
    ...(isProd ? {} : { stack: err.stack })
  });
};
