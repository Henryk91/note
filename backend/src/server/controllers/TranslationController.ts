import { Request, Response } from 'express';
import { translationService } from '../services/TranslationService';
import {
  SavedTranslationQuery,
  TranslateTextBody,
  VerifyTranslationBody,
  UpdateScoreBody,
  SaveIncorrectTranslationsBody,
  IncorrectQuery,
} from '../validation/schemas';
import { asyncHandler } from '../middleware/errorHandler';

export class TranslationController {
  getPractice = asyncHandler(async (_req: Request, res: Response) => {
    const result = await translationService.getTranslationPractice();
    res.json(result);
  });

  getLevels = asyncHandler(async (_req: Request, res: Response) => {
    const result = await translationService.getTranslationLevels();
    res.json(result);
  });

  getFullPractice = asyncHandler(async (_req: Request, res: Response) => {
    const result = await translationService.getFullTranslationPractice();
    res.json(result);
  });

  getSaved = asyncHandler(async (req: Request, res: Response) => {
    const { level, subLevel } = req.query as SavedTranslationQuery;
    const result = await translationService.getSavedTranslation(level, subLevel);
    res.json(result);
  });

  translate = asyncHandler(async (req: Request, res: Response) => {
    const { sentence } = req.body as TranslateTextBody;
    const translated = await translationService.translateText(sentence);
    res.json({ translated });
  });

  confirm = asyncHandler(async (req: Request, res: Response) => {
    const { english, german } = req.body as VerifyTranslationBody;
    const isCorrect = await translationService.verifyTranslation(english, german);
    res.json({ isCorrect });
  });

  getScores = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const result = await translationService.getScores(userId);
    res.json(result);
  });

  updateScore = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const result = await translationService.updateScore(userId, req.body as UpdateScoreBody);
    res.json(result);
  });

  getIncorrect = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const { corrected } = req.query as IncorrectQuery;
    const isCorrected = corrected === 'true' ? true : corrected === 'false' ? false : undefined;
    const result = await translationService.getIncorrectTranslations(userId, isCorrected);
    res.json({ items: result });
  });

  saveIncorrect = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const result = await translationService.saveIncorrectTranslations(
      userId,
      req.body as SaveIncorrectTranslationsBody,
    );
    res.json({ ok: result });
  });
}

export const translationController = new TranslationController();
