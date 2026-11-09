import { Router } from 'express';
import * as session from '../controllers/session.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { uuidParam, validate } from '../middleware/validate.js';
import { saveAnswersSchema } from '../schemas/interview.schema.js';

// Mounted at /api/interviews, next to the booking routes: /:id/session and /:id/answers.
const router = Router();

router.use(requireAuth);
router.param('id', uuidParam);

router.post('/:id/session', aiLimiter, session.startSession);
router.put('/:id/answers', validate(saveAnswersSchema), session.saveAnswers);

export default router;
