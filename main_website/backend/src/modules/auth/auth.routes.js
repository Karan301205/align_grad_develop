const express = require('express');
const router = express.Router();
const { authLimit, checkLoginLock } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const authController = require('./auth.controller');
const { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.validator');

// Authentication Routes
router.post('/signup', authLimit, validate(signupSchema), authController.signup);
router.post('/login', authLimit, checkLoginLock, validate(loginSchema), authController.login);
router.post('/google', authLimit, authController.googleAuth);
router.post('/forgot-password', authLimit, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimit, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
