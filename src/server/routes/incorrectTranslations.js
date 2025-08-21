const express = require('express');
const router = express.Router();
const IncorrectTranslation = require('../models/incorrectTranslation'); 

router.post('/', async (req, res) => {
  try {
    const userId = req.auth?.sub;
    // if (!userId) return res.status(401).json({ ok: false, error: 'Unauthenticated' });

    const raw = Array.isArray(req.body) ? req.body : req.body?.items;
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(400).json({ ok: false, error: 'Expected a non-empty array' });
    }

    // Basic validation and shaping; corrected/attempts are optional
    const items = raw.map((it, idx) => {
      const { exerciseId, sentence, userInput, translation, corrected } = it || {};
      if (!exerciseId || !sentence || !userInput || !translation) {
        throw Object.assign(new Error(`Item ${idx} missing required fields`), { status: 400 });
      }
      return { exerciseId, sentence, userInput, translation, corrected };
    });

    // Build bulk upsert ops
    // Pattern: setOnInsert.attempts = 0 and $inc.attempts = 1 => new docs end with attempts = 1
    const ops = items.map(({ exerciseId, sentence, userInput, translation, corrected }) => ({
      updateOne: {
        filter: { userId, exerciseId, sentence },
        update: {
          // Always keep latest userInput/translation; only set corrected if explicitly provided
          $set: {
            userInput,
            translation,
            ...(typeof corrected === 'boolean' ? { corrected } : {})
          },
          $setOnInsert: {
            userId,
            exerciseId,
            sentence,
            // attempts: 0,
            corrected: false
          },
          $inc: { attempts: 1 }
        },
        upsert: true
      }
    }));

    const result = await IncorrectTranslation.bulkWrite(ops, { ordered: false });

    return res.json({
      ok: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount || 0,
      n: result.result?.n || undefined
    });
  } catch (err) {
    const status = err.status || 500;
    console.log('Insert Error:', err.message);
    return res.status(status).json({ ok: false, error: err.message || 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const userId = req.auth?.sub;
    // const userId =
    //   req.auth?.sub || req.user?.id || req.user?.sub || req.userId; // adapt to your auth
    // if (!userId) return res.status(401).json({ ok: false, error: 'Unauthenticated' });

    const { corrected } = req.query;

    const filter = { userId };
    if (typeof corrected !== 'undefined') {
      filter.corrected = corrected === 'true';
    }

    const docs = await IncorrectTranslation.find(filter).sort({ updatedAt: -1 });

    return res.json({ ok: true, items: docs });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Server error' });
  }
});

module.exports = router;
