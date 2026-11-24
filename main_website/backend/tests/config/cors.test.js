// Browser origins allowed to call the API (config/cors.js).
const test = require('node:test');
const assert = require('node:assert');
const { allowedOrigins, corsOrigin } = require('../../src/config/cors');

test('without CORS_ORIGINS every origin is allowed, as before', () => {
  assert.strictEqual(allowedOrigins({ CORS_ORIGINS: [], CLIENT_URL: 'https://aligngrad.com' }), null);
  assert.strictEqual(corsOrigin({ CORS_ORIGINS: [] }), true);
});

test('with CORS_ORIGINS, the listed origins plus the portal URLs\' origins are allowed', () => {
  const list = allowedOrigins({
    CORS_ORIGINS: ['https://candidate.aligngrad.com/', 'https://recruiter.aligngrad.com', 'not a url'],
    CLIENT_URL: 'https://aligngrad.com',
    CANDIDATE_PORTAL_URL: 'https://candidate.aligngrad.com/candidate/login',
    RECRUITER_PORTAL_URL: ''
  });
  assert.deepStrictEqual(list.sort(), ['https://aligngrad.com', 'https://candidate.aligngrad.com', 'https://recruiter.aligngrad.com']);
});
