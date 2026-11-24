const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const { relaxedLimit, costlyLimit } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const paymentController = require('./payment.controller');
const { createOrderSchema, verifyPaymentSchema } = require('./payment.validator');

// Create Razorpay Order
// costlyLimit: each order is a Razorpay API call (30 an hour per user by default).
router.post('/create-order', authMiddleware, relaxedLimit, costlyLimit, validate(createOrderSchema), paymentController.createOrder);

// Verify Razorpay Payment Signature
router.post('/verify', authMiddleware, relaxedLimit, validate(verifyPaymentSchema), paymentController.verifyPayment);

// Get Subscription & Quota Status
router.get('/status', authMiddleware, relaxedLimit, paymentController.getPlanStatus);

// Completed payments of the signed-in user
router.get('/history', authMiddleware, relaxedLimit, paymentController.getPaymentHistory);

module.exports = router;
