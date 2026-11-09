import 'dotenv/config';
import { z } from 'zod';

// Env vars arrive as strings. Parse and validate once at boot so a typo fails fast, with a clear message.
const flag = (fallback) => z.string().default(fallback).transform((v) => v === 'true');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

    SUPABASE_URL: z.string().url('must be your Supabase project URL'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'is missing (Supabase → Settings → API Keys → secret key)'),
    SUPABASE_RESUME_BUCKET: z.string().min(3).default('resumes'),

    JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().min(3).default('gemini-3.5-flash-lite'),
    GEMINI_API: z.enum(['interactions', 'generateContent']).default('interactions'),
    GEMINI_MOCK: flag('false'),

    SLOT_TZ: z.string().default('Asia/Kolkata'),
    SLOT_START_HOUR: z.coerce.number().int().min(0).max(23).default(10),
    SLOT_END_HOUR: z.coerce.number().int().min(1).max(24).default(18),
    SLOT_MINUTES: z.coerce.number().int().min(15).max(180).default(60),
    SLOT_DAYS_AHEAD: z.coerce.number().int().min(1).max(60).default(14),
    SLOT_LEAD_MINUTES: z.coerce.number().int().min(0).default(30),
    SLOT_ENFORCE_WINDOW: flag('false'),
    SESSION_MINUTES: z.coerce.number().int().min(10).max(120).default(45),
    QUESTIONS_PER_SESSION: z.coerce.number().int().min(1).max(10).default(5),
  })
  .superRefine((cfg, ctx) => {
    if (!cfg.GEMINI_MOCK && !cfg.GEMINI_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['GEMINI_API_KEY'],
        message: 'is missing. Add a key from Google AI Studio, or set GEMINI_MOCK=true to use offline fixtures',
      });
    }
    if (cfg.SLOT_END_HOUR <= cfg.SLOT_START_HOUR) {
      ctx.addIssue({ code: 'custom', path: ['SLOT_END_HOUR'], message: 'must be later than SLOT_START_HOUR' });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`\nInvalid server configuration:\n${lines}\n\nCopy server/.env.example to server/.env and fill it in.\n`);
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
