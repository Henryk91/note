import { Application } from 'express';
import { translationController } from '../controllers/TranslationController';

export default function translate(app: Application) {
  app.get('/api/translate-practice', (req, res) => translationController.getPractice(req, res));

  app.get('/api/translate-levels', (req, res) => translationController.getLevels(req, res));

  app.get('/api/full-translate-practice', (req, res) => translationController.getFullPractice(req, res));

  app.get('/api/saved-translation', (req, res) => translationController.getSaved(req, res));

  app.post('/api/translate', (req, res) => translationController.translate(req, res));

  app.post('/api/confirm-translation', (req, res) => translationController.confirm(req, res));
}
