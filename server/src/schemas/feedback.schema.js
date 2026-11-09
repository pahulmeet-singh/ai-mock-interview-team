import { z } from 'zod';

// What the AI must return. We never trust model output: it is parsed against this schema before it is stored.
export const CRITERIA = ['technicalAccuracy', 'depth', 'problemSolving', 'communication', 'structure'];

const score = z.number().min(0).max(10);
const text = (max) => z.string().trim().min(1).max(max);

export const questionsSchema = z.object({
  questions: z.array(z.object({ prompt: text(700), topic: text(80) })).min(1).max(10),
});

export const evaluationSchema = z.object({
  scores: z.object(Object.fromEntries(CRITERIA.map((key) => [key, score]))),
  summary: text(1500),
  strengths: z.array(text(400)).min(1).max(8),
  weaknesses: z.array(text(400)).min(1).max(8),
  recommendations: z.array(text(400)).min(1).max(6),
  perQuestion: z
    .array(z.object({ index: z.number().int().min(0), score, feedback: text(1500), betterAnswer: text(1800) }))
    .min(1),
});
