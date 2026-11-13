// Error responses that never show internals to the user. The full error is always
// logged on the server. Client errors (4xx thrown on purpose, e.g. "You are not a
// member of this community") and errors marked `expose = true` (a message written
// for users, such as "Failed to send verification email…") keep their message;
// anything unexpected (5xx, or an error from the database driver or a programming
// bug) gets the plain `fallback`.
// Outside production the technical message is also sent as `detail`, which the
// frontend prints to the browser console only.

const isProduction = () => process.env.NODE_ENV === 'production';

function isInternalError(err) {
  if (!err) return true;
  const name = String(err.name || '');
  return (
    name.startsWith('Prisma') ||
    /^P\d{4}$/.test(String(err.code || '')) ||
    err instanceof TypeError ||
    err instanceof ReferenceError ||
    err instanceof SyntaxError
  );
}

function sendError(res, err, status, fallback) {
  console.error(`[api] ${fallback}:`, err);
  const internal = !(err && err.expose === true) && (status >= 500 || isInternalError(err));
  if (internal) {
    return res.status(status >= 500 ? status : 500).json({
      error: fallback,
      ...(isProduction() ? {} : { detail: err?.message || String(err) })
    });
  }
  // `public` tells the frontend this 5xx message was written for users and can be shown.
  return res.status(status).json({ error: err.message || fallback, ...(status >= 500 ? { public: true } : {}) });
}

module.exports = { sendError, isInternalError };
