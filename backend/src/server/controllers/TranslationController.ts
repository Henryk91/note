import { Request, Response } from 'express';
import { translationService } from '../services/TranslationService';
import { SavedTranslationQuery } from '../types/models';

export class TranslationController {
  async getPractice(req: Request, res: Response) {
    try {
      const result = await translationService.getTranslationPractice();
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
      const result = await translationService.getSavedTranslation(
        level,
        subLevel,
      );
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json(null);
    }
  }

  async translate(req: Request, res: Response) {
    const { sentence } = req.body as { sentence?: string };
    if (!sentence) {
      return res
        .status(400)
        .json({ error: 'Missing sentence in request body' });
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
    const { english, german } = req.body as {
      english?: string;
      german?: string;
    };
    if (!english || !german)
      return res
        .status(400)
        .json({ error: 'Missing english/german body params' });

    try {
      const isCorrect = await translationService.verifyTranslation(
        english,
        german,
      );
      return res.json({ isCorrect });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Translation check failed' });
    }
  }

  async getScores(req: Request, res: Response) {
    try {
      const { userId } = req.auth!;

      const result = await translationService.getScores(userId);
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch scores' });
    }
  }

  async updateScore(req: Request, res: Response) {
    try {
      const { userId } = req.auth!;

      const result = await translationService.updateScore(userId, req.body);
      return res.json(result);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message });
    }
  }

  async getIncorrect(req: Request, res: Response) {
    try {
      const { userId } = req.auth!;

      const { corrected } = req.query as { corrected?: string };
      let isCorrected: boolean | undefined;
      if (corrected === 'true') {
        isCorrected = true;
      } else if (corrected === 'false') {
        isCorrected = false;
      }

      const result = await translationService.getIncorrectTranslations(
        userId,
        isCorrected,
      );
      return res.json(result);
    } catch (error: unknown) {
      console.error('getIncorrect error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async saveIncorrect(req: Request, res: Response) {
    try {
      const { userId } = req.auth!;

      const result = await translationService.saveIncorrectTranslations(
        userId,
        req.body,
      );
      return res.json({
        Ok: result,
      });
    } catch (error: unknown) {
      console.error('saveIncorrect error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const translationController = new TranslationController();
