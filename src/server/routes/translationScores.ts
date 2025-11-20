import { Request, Response, Router } from 'express';
import TranslationScore from '../models/TranslationScore';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth?.sub;
    const filter = userId ? { userId } : {};
    const docs = await TranslationScore.find(filter).lean();
    res.json(docs);
  } catch (err) {
    console.error('GET /translation-scores error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth?.sub;
    const { exerciseId, score, attempts } = req.body || {};
    if (!userId || !exerciseId || typeof score !== 'number') {
      return res.status(400).json({ error: 'userId, exerciseId, and numeric score are required' });
    }
    if (score < 0 || score > 100) {
      return res.status(400).json({ error: 'score must be between 0 and 100' });
    }

    const update: any = { score };
    if (typeof attempts === 'number' && attempts >= 1) update.attempts = attempts;

    const doc = await TranslationScore.findOneAndUpdate(
      { userId, exerciseId },
      { $set: update, $setOnInsert: { userId, exerciseId } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(doc);
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Duplicate key for userId+exerciseId' });
    }
    console.error('POST /translation-scores error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
