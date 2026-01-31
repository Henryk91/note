import { Router } from 'express';
import { translationController } from '../controllers/TranslationController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();
router.get('/translate-practice', isAuthenticated, (req, res) => translationController.getPractice(req, res));
router.get('/translate-levels', (req, res) => translationController.getLevels(req, res));
router.get('/full-translate-practice', (req, res) => translationController.getFullPractice(req, res));
router.get('/saved-translation', (req, res) => translationController.getSaved(req, res));
router.post('/translate', (req, res) => translationController.translate(req, res));
router.post('/confirm-translation', (req, res) => translationController.confirm(req, res));

router.get('/incorrect-translations/', isAuthenticated, translationController.getIncorrect);
router.post('/incorrect-translations/', isAuthenticated, translationController.saveIncorrect);

router.get('/translation-scores/', isAuthenticated, translationController.getScores);
router.post('/translation-scores/', isAuthenticated, translationController.updateScore);

export default router;
