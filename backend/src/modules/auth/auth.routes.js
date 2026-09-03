const express = require('express');
const router = express.Router();
const { authLimit, checkLoginLock } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const authController = require('./auth.controller');
const { signupSchema, loginSchema } = require('./auth.validator');

// Authentication Routes
router.post('/signup', authLimit, validate(signupSchema), authController.signup);
router.post('/login', authLimit, checkLoginLock, validate(loginSchema), authController.login);
router.post('/google', authLimit, authController.googleAuth);

module.exports = router;
