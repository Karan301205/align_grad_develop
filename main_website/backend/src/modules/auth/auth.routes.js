const express = require('express');
const router = express.Router();
const { authLimit, emailLimit, checkLoginLock } = require('../../middleware/rateLimiter');
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
router.post('/signup', authLimit, emailLimit, validate(signupSchema), authController.signup);
router.post('/signup/initiate', authLimit, emailLimit, validate(signupSchema), authController.signup);
router.post('/signup/verify', authLimit, validate(verifyPinSchema), authController.verifyPin);
router.post('/signup/resend-pin', authLimit, emailLimit, validate(resendPinSchema), authController.resendPin);
router.post('/login', authLimit, checkLoginLock, validate(loginSchema), authController.login);
router.post('/google', authLimit, authController.googleAuth);
router.post('/forgot-password', authLimit, emailLimit, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimit, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
