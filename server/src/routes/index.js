import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './categories.routes.js';
import slotRoutes from './slots.routes.js';
import resumeRoutes from './resumes.routes.js';
import interviewRoutes from './interviews.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/slots', slotRoutes);
router.use('/resumes', resumeRoutes);
router.use('/interviews', interviewRoutes);

export default router;
