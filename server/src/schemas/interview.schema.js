import { z } from 'zod';
import { CATEGORY_IDS, DIFFICULTIES } from '../config/categories.js';

export const createInterviewSchema = z.object({
  category: z.enum(CATEGORY_IDS, { error: 'Choose a category.' }),
  difficulty: z.enum(DIFFICULTIES, { error: 'Choose a difficulty.' }),
  scheduledAt: z.string({ error: 'Pick a time slot.' }).datetime({ message: 'Pick a valid time slot.' }),
  resumeId: z.string().uuid('Choose one of your resumes.').nullish(),
});

// "upcoming" groups booked + in_progress; "cancelled" groups cancelled + missed.
export const listInterviewsQuery = z.object({
  status: z.enum(['upcoming', 'completed', 'cancelled']).optional(),
  category: z.enum(CATEGORY_IDS).optional(),
});

export const patchInterviewSchema = z.object({
  status: z.literal('cancelled', { error: 'Only cancelling is supported.' }),
});

const answerMap = z.record(z.string().regex(/^\d+$/), z.string().max(6000, 'Answers are limited to 6000 characters.'));

export const saveAnswersSchema = z.object({ answers: answerMap });
export const submitSchema = z.object({ answers: answerMap.optional() }).optional();
