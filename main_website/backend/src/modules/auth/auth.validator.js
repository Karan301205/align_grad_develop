const { z } = require('zod');

const signupSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters long')
      .regex(/^\S+$/, 'Password cannot contain spaces'),
    role: z.enum(['STUDENT', 'RECRUITER'], { errorMap: () => ({ message: "Role must be either 'STUDENT' or 'RECRUITER'" }) }),
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters')
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    password: z.string()
      .min(1, 'Password is required')
      .regex(/^\S+$/, 'Password cannot contain spaces'),
    role: z.enum(['STUDENT', 'RECRUITER']).optional()
  })
};

const forgotPasswordSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    role: z.enum(['STUDENT', 'RECRUITER']).optional()
  })
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters long')
      .regex(/^\S+$/, 'Password cannot contain spaces'),
    confirmPassword: z.string().min(1, 'Confirm password is required')
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })
};

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
