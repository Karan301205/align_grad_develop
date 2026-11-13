const { z } = require('zod');
const { PLAN_TYPES } = require('./plans');

// middleware/validate.js reads schema.body / .params / .query, so each schema is
// a plain object (a bare z.object would be skipped silently; ISSUES A7).

const planTypeSchema = z.enum(PLAN_TYPES, {
  error: `planType must be one of ${PLAN_TYPES.join(', ')}`
});

const createOrderSchema = {
  body: z.object({
    planType: planTypeSchema
  })
};

// planType is accepted for older clients but ignored: the plan always comes from
// the stored order.
const verifyPaymentSchema = {
  body: z.object({
    razorpay_order_id: z.string().trim().min(1, 'razorpay_order_id is required').max(100),
    razorpay_payment_id: z.string().trim().min(1, 'razorpay_payment_id is required').max(100),
    razorpay_signature: z.string().trim().min(1, 'razorpay_signature is required').max(256),
    planType: planTypeSchema.optional()
  })
};

module.exports = {
  createOrderSchema,
  verifyPaymentSchema
};
