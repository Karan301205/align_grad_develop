const { z } = require('zod');

const signupSchema = {
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['STUDENT', 'RECRUITER'], { errorMap: () => ({ message: "Role must be either 'STUDENT' or 'RECRUITER'" }) }),
    name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters')
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required'),
    role: z.enum(['STUDENT', 'RECRUITER']).optional()
  })
};

module.exports = {
  signupSchema,
  loginSchema
};
