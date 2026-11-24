// Checks the answer Google's tokeninfo service gives for a sign-in credential.
// The token must come from Google, be issued for THIS app (aud = our client ID), belong to a
// verified email address, and not have expired. Without this, a token issued to some other app
// that a user signed into could be used to sign in here as that user (ISSUES A1).

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

/** Returns why the token must be refused, or null when it is acceptable. */
function googleTokenProblem(info, clientId) {
  if (!clientId) return 'Google sign-in is not configured on the server.';
  if (!info || typeof info !== 'object') return 'Google did not confirm the sign-in. Please try again.';
  if (!GOOGLE_ISSUERS.includes(info.iss)) return 'That Google sign-in was not issued by Google.';
  if (info.aud !== clientId) return 'That Google sign-in was issued for a different app.';
  if (!(info.email_verified === true || info.email_verified === 'true')) return 'Your Google email address is not verified.';
  const expires = Number(info.exp);
  if (!expires || expires * 1000 <= Date.now()) return 'That Google sign-in has expired. Please try again.';
  return null;
}

module.exports = { googleTokenProblem };
