import { Router } from 'express';
import * as resumes from '../controllers/resumes.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadResume } from '../middleware/upload.js';
import { uuidParam } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);
router.param('id', uuidParam);

router.get('/', resumes.list);
router.post('/', uploadResume, resumes.create);
router.delete('/:id', resumes.remove);
router.get('/:id/download', resumes.download);

export default router;
