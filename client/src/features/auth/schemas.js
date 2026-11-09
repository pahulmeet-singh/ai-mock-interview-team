import { z } from 'zod';

// Client-side validation gives instant feedback. The server re-validates the same rules: never trust the client.
const email = z.string().trim().min(1, 'Enter your email.').email('Enter a valid email address.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(60, 'Name must be at most 60 characters.'),
    email,
    targetRole: z.string().trim().max(80, 'Keep it under 80 characters.').optional(),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(72, 'Use at most 72 characters.')
      .regex(/[A-Za-z]/, 'Include at least one letter.')
      .regex(/\d/, 'Include at least one number.'),
    confirmPassword: z.string().min(1, 'Re-enter your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });
