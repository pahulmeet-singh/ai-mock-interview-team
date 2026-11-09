import { z } from 'zod';

export const bookingSchema = z.object({
  category: z.string().min(1, 'Choose a category.'),
  difficulty: z.enum(['foundation', 'intermediate', 'advanced'], { error: 'Choose a difficulty.' }),
  scheduledAt: z.string().min(1, 'Pick a time slot.'),
  resumeId: z.string().optional(), // '' means no resume
});
