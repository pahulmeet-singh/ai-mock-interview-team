import { Router } from 'express';
import * as feedbacks from '../controllers/feedbacks.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { uuidParam, validate } from '../middleware/validate.js';
import { submitSchema } from '../schemas/interview.schema.js';

// Feedback is a sub-resource of an interview (/api/interviews/:id/feedback) ...
export const interviewFeedbackRoutes = Router();
interviewFeedbackRoutes.use(requireAuth);
interviewFeedbackRoutes.param('id', uuidParam);
interviewFeedbackRoutes.post('/:id/feedback', aiLimiter, validate(submitSchema), feedbacks.create);
interviewFeedbackRoutes.get('/:id/feedback', feedbacks.getForInterview);

// ... and also a collection of its own for the dashboard (/api/feedbacks).
const router = Router();
router.get('/', requireAuth, feedbacks.list);

export default router;
