import { Router } from 'express';
import * as categories from '../controllers/categories.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, categories.list);

export default router;
