const { z } = require('zod');

const idRegex = /^[0-9a-fA-F]{24}$/;
const idSchema = z.string().regex(idRegex, 'Invalid ID format');

const reviewVerificationSchema = {
  params: z.object({
    recruiterId: idSchema
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
