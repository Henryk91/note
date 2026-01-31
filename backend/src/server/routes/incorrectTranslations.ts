import { Router } from 'express';
import { translationController } from '../controllers/TranslationController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.get('/', isAuthenticated, translationController.getIncorrect);
router.post('/', isAuthenticated, translationController.saveIncorrect);

export default router;
