const express = require('express');
const router = express.Router();
const { authLimit, emailLimit, checkLoginLock, checkCodeLock } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const authController = require('./auth.controller');
const { 
  signupSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  verifyPinSchema,
  resendPinSchema
} = require('./auth.validator');

// Authentication Routes
// emailLimit: routes that send an email share one count per network address.
// checkCodeLock: a sign-up whose code was guessed wrong 5 times waits 10 minutes (all sign-up steps,
// so signing up again can't skip the wait). checkLoginLock: 5 wrong passwords lock the account 10 minutes.
router.post('/signup', authLimit, checkCodeLock, emailLimit, validate(signupSchema), authController.signup);
router.post('/signup/initiate', authLimit, checkCodeLock, emailLimit, validate(signupSchema), authController.signup);
router.post('/signup/verify', authLimit, checkCodeLock, validate(verifyPinSchema), authController.verifyPin);
router.post('/signup/resend-pin', authLimit, checkCodeLock, emailLimit, validate(resendPinSchema), authController.resendPin);
router.post('/login', authLimit, checkLoginLock, validate(loginSchema), authController.login);
router.post('/google', authLimit, authController.googleAuth);
router.post('/forgot-password', authLimit, emailLimit, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimit, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
