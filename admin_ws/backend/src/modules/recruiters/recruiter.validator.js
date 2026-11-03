const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ID format');

const reviewVerificationSchema = {
  params: z.object({
    recruiterId: objectIdSchema
  }),
  body: z.object({
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().trim().max(1000, 'Reason cannot exceed 1000 characters').optional()
  }).refine(data => data.decision === 'APPROVE' || (data.reason && data.reason.length >= 5), {
    message: 'A rejection reason of at least 5 characters is required',
    path: ['reason']
  })
};

module.exports = {
  reviewVerificationSchema
};
