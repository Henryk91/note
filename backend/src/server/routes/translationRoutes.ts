import { Router } from 'express';
import { translationController } from '../controllers/TranslationController';
import { isAuthenticated } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import {
  TranslateTextSchema,
  VerifyTranslationSchema,
  UpdateScoreSchema,
  SaveIncorrectTranslationsSchema,
  SavedTranslationQuerySchema,
  IncorrectQuerySchema,
} from '../validation/schemas';

const router = Router();
router.get('/translate-practice', isAuthenticated, translationController.getPractice);
router.get('/translate-levels', translationController.getLevels);
router.get('/full-translate-practice', translationController.getFullPractice);
router.get('/saved-translation', validateQuery(SavedTranslationQuerySchema), translationController.getSaved);
router.post('/translate', validateBody(TranslateTextSchema), translationController.translate);
router.post('/confirm-translation', validateBody(VerifyTranslationSchema), translationController.confirm);

router.get(
  '/incorrect-translations/',
  isAuthenticated,
  validateQuery(IncorrectQuerySchema),
  translationController.getIncorrect,
);
router.post(
  '/incorrect-translations/',
  isAuthenticated,
  validateBody(SaveIncorrectTranslationsSchema),
  translationController.saveIncorrect,
);

router.get('/translation-scores/', isAuthenticated, translationController.getScores);
router.post(
  '/translation-scores/',
  isAuthenticated,
  validateBody(UpdateScoreSchema),
  translationController.updateScore,
);

export default router;
