import { Router } from 'express';

import { authRouter } from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import emailRoutes from './emailRoutes';
import noteRoutes from './noteRoutes';
import translationRoutes from './translationRoutes';

const router = Router();

router.use(noteRoutes);
router.use(translationRoutes);
router.use(dashboardRoutes);
router.use(emailRoutes);
router.use(authRouter);

export default router;
