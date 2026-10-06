const { z } = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    planType: z.enum(['STUDENT_LIFETIME', 'RECRUITER_5_PACK'], {
      errorMap: () => ({ message: 'planType must be STUDENT_LIFETIME or RECRUITER_5_PACK' })
    })
  })
});

const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1, 'razorpay_order_id is required'),
    razorpay_payment_id: z.string().min(1, 'razorpay_payment_id is required'),
    razorpay_signature: z.string().min(1, 'razorpay_signature is required'),
    planType: z.enum(['STUDENT_LIFETIME', 'RECRUITER_5_PACK'], {
      errorMap: () => ({ message: 'planType must be STUDENT_LIFETIME or RECRUITER_5_PACK' })
    })
  })
});

module.exports = {
  createOrderSchema,
  verifyPaymentSchema
};
