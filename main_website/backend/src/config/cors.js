// Which browser origins may call the API (HTTP and Socket.IO).
//
// CORS_ORIGINS (comma separated) turns on the allow-list; the origins of CLIENT_URL,
// CANDIDATE_PORTAL_URL and RECRUITER_PORTAL_URL are always added to it. Requests without an
// Origin header (server-to-server, curl, same-origin) are unaffected. With CORS_ORIGINS empty
// every origin is allowed, as before, and the server says so at start-up: list every frontend
// domain (landing, candidate, recruiter…) before setting it, or those sites stop working.

const originOf = (value) => {
  try {
    return new URL(String(value).trim()).origin;
  } catch {
    return '';
  }
};

/** The allowed origins, or null when the allow-list is off (CORS_ORIGINS empty). */
function allowedOrigins(env) {
  if (!env.CORS_ORIGINS || env.CORS_ORIGINS.length === 0) return null;
  const listed = env.CORS_ORIGINS.map((value) => {
    const origin = originOf(value);
    if (!origin) console.warn(`[config] CORS_ORIGINS has an entry that isn't a URL and is ignored: "${value}"`);
    return origin;
  });
  const portals = [env.CLIENT_URL, env.CANDIDATE_PORTAL_URL, env.RECRUITER_PORTAL_URL].filter(Boolean).map(originOf);
  return [...new Set([...listed, ...portals].filter(Boolean))];
}

let warned = false;

/** The `origin` option for the cors package and Socket.IO: a list, or true (any origin). */
function corsOrigin(env = require('./env')) {
  const list = allowedOrigins(env);
  if (list) return list;
  if (!warned) {
    warned = true;
    console.warn('[config] CORS_ORIGINS is not set, so any website may call this API from a browser. Set it to the frontend origins in production.');
  }
  return true;
}

module.exports = { allowedOrigins, corsOrigin };
