import { Router } from 'express';
import * as slots from '../controllers/slots.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, slots.list);

export default router;
