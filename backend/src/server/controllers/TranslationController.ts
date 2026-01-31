import { Request, Response } from 'express';
import { translationService } from '../services/TranslationService';
import { SavedTranslationQuery } from '../types/models';

export class TranslationController {
  async getPractice(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await translationService.getTranslationPractice(userId);
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json(null);
    }
  }

  async getLevels(_req: Request, res: Response) {
    try {
      const result = await translationService.getTranslationLevels();
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json(null);
    }
  }

  async getFullPractice(_req: Request, res: Response) {
    try {
      const result = await translationService.getFullTranslationPractice();
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json(null);
    }
  }

  async getSaved(req: Request, res: Response) {
    try {
      const { level, subLevel } = req.query as SavedTranslationQuery;
      if (!level || !subLevel) {
        return res.json(null);
      }
      const result = await translationService.getSavedTranslation(level, subLevel);
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json(null);
    }
  }

  async translate(req: Request, res: Response) {
    const { sentence } = req.body as { sentence?: string };
    if (!sentence) {
      return res.status(400).json({ error: 'Missing sentence in request body' });
    }
    try {
      const translated = await translationService.translateText(sentence);
      return res.json({ translated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Translation proxy error' });
    }
  }

  async confirm(req: Request, res: Response) {
    const { english, german } = req.body as { english?: string; german?: string };
    if (!english || !german) return res.status(400).json({ error: 'Missing english/german body params' });

    try {
      const isCorrect = await translationService.verifyTranslation(english, german);
      return res.json({ isCorrect });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Translation check failed' });
    }
  }
}

export const translationController = new TranslationController();
