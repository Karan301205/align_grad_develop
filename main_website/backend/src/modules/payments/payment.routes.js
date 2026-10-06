const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const { relaxedLimit } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const paymentController = require('./payment.controller');
const { createOrderSchema, verifyPaymentSchema } = require('./payment.validator');

// Create Razorpay Order
router.post('/create-order', authMiddleware, relaxedLimit, validate(createOrderSchema), paymentController.createOrder);

// Verify Razorpay Payment Signature
router.post('/verify', authMiddleware, relaxedLimit, validate(verifyPaymentSchema), paymentController.verifyPayment);

// Get Subscription & Quota Status
router.get('/status', authMiddleware, relaxedLimit, paymentController.getPlanStatus);

module.exports = router;
