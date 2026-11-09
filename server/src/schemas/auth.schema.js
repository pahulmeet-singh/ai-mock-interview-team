import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(60, 'Name must be at most 60 characters.'),
  email,
  // bcrypt only reads the first 72 bytes, so longer passwords would be silently truncated.
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(72, 'Use at most 72 characters.')
    .regex(/[A-Za-z]/, 'Include at least one letter.')
    .regex(/\d/, 'Include at least one number.'),
  targetRole: z.string().trim().max(80, 'Keep it under 80 characters.').optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});
