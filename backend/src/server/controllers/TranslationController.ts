import { Request, Response } from 'express';
import { translationService } from '../services/TranslationService';

export class TranslationController {
  async getPractice(req: Request, res: Response) {
    try {
      const userId = (req as any).auth?.sub; // Not used in service currently (hardcoded)
      const result = await translationService.getTranslationPractice(userId);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json(null);
    }
  }

  async getLevels(req: Request, res: Response) {
    try {
      const userId = (req as any).auth?.sub;
      const result = await translationService.getTranslationLevels(userId);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json(null);
    }
  }

  async getFullPractice(req: Request, res: Response) {
    try {
      const result = await translationService.getFullTranslationPractice();
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json(null);
    }
  }

  async getSaved(req: Request, res: Response) {
    try {
      const { level, subLevel } = req.query as { level?: string; subLevel?: string };
      if (!level || !subLevel) {
        return res.json(null);
      }
      const result = await translationService.getSavedTranslation(level, subLevel);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json(null);
    }
  }

  async translate(req: Request, res: Response) {
    const { sentence } = req.body as { sentence?: string };
    if (!sentence) {
      return res.status(400).json({ error: 'Missing sentence in request body' });
    }
    try {
      const translated = await translationService.translateText(sentence);
      res.json({ translated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Translation proxy error' });
    }
  }

  async confirm(req: Request, res: Response) {
    const { english, german } = req.body as { english?: string; german?: string };
    if (!english || !german) return res.status(400).json({ error: 'Missing english/german body params' });

    try {
      const isCorrect = await translationService.verifyTranslation(english, german);
      res.json({ isCorrect });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Translation check failed' });
    }
  }
}

export const translationController = new TranslationController();
