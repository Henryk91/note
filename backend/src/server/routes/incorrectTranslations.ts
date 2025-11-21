import { Request, Response, Router } from 'express';
import IncorrectTranslation from '../models/incorrectTranslation';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth?.sub;
    const raw = Array.isArray(req.body) ? req.body : (req.body as any)?.items;
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(400).json({ ok: false, error: 'Expected a non-empty array' });
    }

    const items = raw.map((it: any, idx: number) => {
      const { exerciseId, sentence, userInput, translation, corrected } = it || {};
      if (!exerciseId || !sentence || !userInput || !translation) {
        throw Object.assign(new Error(`Item ${idx} missing required fields`), { status: 400 });
      }
      return { exerciseId, sentence, userInput, translation, corrected };
    });

    const ops = items.map(({ exerciseId, sentence, userInput, translation, corrected }) => ({
      updateOne: {
        filter: { userId, exerciseId, sentence },
        update: {
          $set: {
            userInput,
            translation,
            ...(typeof corrected === 'boolean' ? { corrected } : {}),
          },
          $setOnInsert: {
            userId,
            exerciseId,
            sentence,
          },
          $inc: { attempts: 1 },
        },
        upsert: true,
        setDefaultsOnInsert: true,
      },
    }));

    const result = await IncorrectTranslation.bulkWrite(ops, { ordered: false });

    return res.json({
      ok: true,
      matched: (result as any).matchedCount,
      modified: (result as any).modifiedCount,
      upserted: (result as any).upsertedCount || 0,
      n: (result as any).result?.n || undefined,
    });
  } catch (err: any) {
    const status = err.status || 500;
    console.log('Insert Error:', err.message);
    return res.status(status).json({ ok: false, error: err.message || 'Server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth?.sub;
    const { corrected } = req.query;

    const filter: any = { userId };
    if (typeof corrected !== 'undefined') {
      filter.corrected = corrected === 'true';
    }

    const docs = await IncorrectTranslation.find(filter, { exerciseId: 1, sentence: 1, translation: 1, _id: 0 }).sort({
      updatedAt: 1,
    });

    return res.json({ ok: true, items: docs });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Server error' });
  }
});

export default router;
