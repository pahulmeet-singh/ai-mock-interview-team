import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const reply = (message) => (_req, res) => res.status(429).json({ error: { status: 429, message } });
const base = { standardHeaders: 'draft-8', legacyHeaders: false };

export const generalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 1000, // generous: a whole classroom may share one IP during a demo
  handler: reply('Too many requests. Please slow down.'),
});

export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  handler: reply('Too many attempts. Try again in a few minutes.'),
});

// Starting a session or requesting feedback calls the AI, which is the scarce, quota-limited resource.
export const aiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 8,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip),
  handler: reply('You are using the AI too quickly. Wait a minute and try again.'),
});
