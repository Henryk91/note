import { Router } from 'express';
import { translationController } from '../controllers/TranslationController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.get('/', isAuthenticated, translationController.getScores);
router.post('/', isAuthenticated, translationController.updateScore);

export default router;
