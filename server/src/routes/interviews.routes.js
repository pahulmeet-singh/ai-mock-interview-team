import { Router } from 'express';
import * as interviews from '../controllers/interviews.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uuidParam, validate } from '../middleware/validate.js';
import { createInterviewSchema, listInterviewsQuery, patchInterviewSchema } from '../schemas/interview.schema.js';

const router = Router();

router.use(requireAuth);
router.param('id', uuidParam);

router.get('/', validate(listInterviewsQuery, 'query'), interviews.list);
router.post('/', validate(createInterviewSchema), interviews.create);
router.get('/:id', interviews.getOne);
router.patch('/:id', validate(patchInterviewSchema), interviews.cancel);

export default router;
