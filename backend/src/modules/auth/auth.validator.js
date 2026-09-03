const { z } = require('zod');

const signupSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters long')
      .regex(/^\S+$/, 'Password cannot contain spaces')
      .refine(val => !val.includes('@'), { message: "Password cannot contain '@' symbol" }),
    role: z.enum(['STUDENT', 'RECRUITER'], { errorMap: () => ({ message: "Role must be either 'STUDENT' or 'RECRUITER'" }) }),
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters')
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    password: z.string()
      .min(1, 'Password is required')
      .regex(/^\S+$/, 'Password cannot contain spaces')
      .refine(val => !val.includes('@'), { message: "Password cannot contain '@' symbol" }),
    role: z.enum(['STUDENT', 'RECRUITER']).optional()
  })
};

module.exports = {
  signupSchema,
  loginSchema
};
