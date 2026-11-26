// The auth controller's side of the locks: the 5th wrong sign-up code locks that sign-up, and a
// password reset ends a sign-in lock. Runs on the in-memory test DB; the services are stubbed.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.REDIS_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const auth = require('../../src/modules/auth/auth.controller');
const { emailVerificationService, passwordResetService } = require('../../src/modules/auth/services');
const { checkCodeLock, checkLoginLock, recordFailedAttempt } = require('../../src/middleware/rateLimiter');

function call(handler, body) {
  return new Promise((resolve) => {
    const res = {
      setHeader() {},
      status(code) { this.code = code; return this; },
      json(payload) { resolve({ status: this.code || 200, body: payload }); return this; }
    };
    handler({ body, headers: {}, socket: {}, ip: '10.9.0.1' }, res, () => resolve({ status: 200 }));
  });
}

test('the 5th wrong sign-up code locks every sign-up step for that email', async (t) => {
  t.mock.method(emailVerificationService, 'verifyPin', async () => {
    const error = new Error('Incorrect verification code. You’ve used all 5 attempts.');
    error.statusCode = 429;
    error.lockSignup = true;
    throw error;
  });
  assert.strictEqual((await call(checkCodeLock, { email: 'pin@example.com' })).status, 200);
  assert.strictEqual((await call(auth.verifyPin, { email: 'pin@example.com', pin: '000000' })).status, 429);
  assert.strictEqual((await call(checkCodeLock, { email: 'pin@example.com' })).status, 429);
});

test('a wrong code before the 5th does not lock the sign-up', async (t) => {
  t.mock.method(emailVerificationService, 'verifyPin', async () => {
    const error = new Error('Incorrect verification code. 3 attempts remaining.');
    error.statusCode = 400;
    throw error;
  });
  await call(auth.verifyPin, { email: 'typo@example.com', pin: '000000' });
  assert.strictEqual((await call(checkCodeLock, { email: 'typo@example.com' })).status, 200);
});

test('resetting the password ends the sign-in lock, and the email is not sent back', async (t) => {
  for (let i = 0; i < 5; i += 1) await recordFailedAttempt('forgot@example.com', '10.9.0.2');
  assert.strictEqual((await call(checkLoginLock, { email: 'forgot@example.com' })).status, 429);
  t.mock.method(passwordResetService, 'resetPassword', async () => ({ success: true, message: 'Reset.', email: 'forgot@example.com' }));
  const reset = await call(auth.resetPassword, { token: 'x', password: 'NewPassword1!' });
  assert.deepStrictEqual(reset.body, { success: true, message: 'Reset.' });
  assert.strictEqual((await call(checkLoginLock, { email: 'forgot@example.com' })).status, 200);
});
