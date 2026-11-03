const { z } = require('zod');

const gigRequirementSchema = z.object({
  skillName: z.string().min(1, 'Skill name must not be empty'),
  minRating: z.number().int().min(0).max(10)
});

const screeningQuestionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['MCQ', 'LONG_ANSWER']),
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).optional().default([]),
  correctAnswer: z.string().optional().nullable(),
  required: z.boolean().optional().default(true)
}).refine(data => {
  if (data.type === 'MCQ') {
    return Array.isArray(data.options) && data.options.length >= 2 && typeof data.correctAnswer === 'string' && data.correctAnswer.trim().length > 0;
  }
  return true;
}, {
  message: 'MCQ questions require at least 2 options and a specified correct answer'
});

const questionAnswerSchema = z.object({
  questionId: z.string().optional().nullable(),
  questionText: z.string().min(1, 'Question text is required'),
  type: z.enum(['MCQ', 'LONG_ANSWER']).default('LONG_ANSWER'),
  answer: z.string().min(1, 'Answer is required')
});

const createGigSchema = {
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters long').max(100, 'Title must not exceed 100 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters long').max(2000, 'Description must not exceed 2000 characters'),
    category: z.string().optional(),
    categories: z.array(z.string()).optional(),
    skills: z.array(z.string().min(1, 'Skill name must not be empty')).min(1, 'At least one skill is required'),
    requirements: z.array(gigRequirementSchema).optional(),
    screeningQuestions: z.array(screeningQuestionSchema).optional().default([]),
    budget: z.number().positive('Budget must be a positive number'),
    currency: z.string().max(10).optional(),
    deliveryTime: z.string().min(1, 'Delivery time designation is required').max(100),
    minRating: z.number().int().min(1).max(10).optional(),
    attachments: z.array(z.string().url('Invalid attachment URL')).optional(),
    logo: z.string().optional().nullable()
  })
};

const applyGigSchema = {
  body: z.object({
    message: z.string().max(1000, 'Cover message must not exceed 1000 characters').optional().nullable(),
    attachments: z.array(z.string().url('Invalid attachment URL')).optional(),
    answers: z.array(questionAnswerSchema).optional().default([])
  })
};

const sendMessageSchema = {
  body: z.object({
    text: z.string().max(2000, 'Message text must not exceed 2000 characters').optional().nullable(),
    fileUrl: z.string().url('Invalid file URL').or(z.literal('')).optional().nullable(),
    receiverId: z.string().optional().nullable()
  }).refine(data => data.text || data.fileUrl, {
    message: 'Either text or file attachment must be provided'
  })
};

const submitWorkSchema = {
  body: z.object({
    text: z.string().max(2000, 'Submission description must not exceed 2000 characters').optional().nullable(),
    fileUrl: z.string().url('Invalid submission file URL').or(z.literal('')).optional().nullable()
  }).refine(data => data.text || data.fileUrl, {
    message: 'Either text summary or file URL is required for submission'
  })
};

const reviewGigSchema = {
  body: z.object({
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must not exceed 5'),
    review: z.string().min(3, 'Review must be at least 3 characters long').max(1000, 'Review must not exceed 1000 characters')
  })
};

const updateGigSchema = {
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters long').max(100, 'Title must not exceed 100 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters long').max(2000, 'Description must not exceed 2000 characters').optional(),
    category: z.string().optional(),
    categories: z.array(z.string()).optional(),
    skills: z.array(z.string().min(1, 'Skill name must not be empty')).min(1, 'At least one skill is required').optional(),
    requirements: z.array(gigRequirementSchema).optional(),
    screeningQuestions: z.array(screeningQuestionSchema).optional(),
    budget: z.number().positive('Budget must be a positive number').optional(),
    currency: z.string().max(10).optional(),
    deliveryTime: z.string().min(1, 'Delivery time designation is required').max(100).optional(),
    minRating: z.number().int().min(1).max(10).optional(),
    attachments: z.array(z.string().url('Invalid attachment URL')).optional(),
    logo: z.string().optional().nullable()
  })
};

module.exports = {
  createGigSchema,
  applyGigSchema,
  sendMessageSchema,
  submitWorkSchema,
  reviewGigSchema,
  updateGigSchema
};
