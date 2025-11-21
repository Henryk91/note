import { Application, Request, Response } from 'express';
import Handler from '../controllers/handlers';

const dbHandler = new Handler();

export default function translate(app: Application) {
  app.get('/api/translate-practice', (_req: Request, res: Response) => {
    dbHandler.getTranslationPractice((docs) => {
      res.json(docs);
    });
  });

  app.get('/api/translate-levels', (_req: Request, res: Response) => {
    dbHandler.getTranslationLevels((docs) => {
      res.json(docs);
    });
  });

  app.get('/api/full-translate-practice', (_req: Request, res: Response) => {
    dbHandler.getFullTranslationPractice((docs) => {
      res.json(docs);
    });
  });

  app.get('/api/saved-translation', (req: Request, res: Response) => {
    dbHandler.getSavedTranslation(req, (docs) => {
      res.json(docs);
    });
  });

  app.post('/api/translate', async (req: Request, res: Response) => {
    const { sentence } = req.body as { sentence?: string };
    if (!sentence) {
      return res.status(400).json({ error: 'Missing sentence in request body' });
    }

    try {
      const inner = JSON.stringify([[sentence, 'en', 'de', 1], []]);
      const fReq = JSON.stringify([[['MkEWBc', inner, null, 'generic']]]);

      const url = new URL('https://translate.google.com/_/TranslateWebserverUi/data/batchexecute');
      const params: Record<string, string> = {
        rpcids: 'MkEWBc',
        'source-path': '/',
        'f.sid': '3888633823004036940',
        bl: 'boq_translate-webserver_20250409.05_p0',
        hl: 'en-US',
        'soc-app': '1',
        'soc-platform': '1',
        'soc-device': '1',
        _reqid: '40663570',
        rt: 'c',
      };
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

      const body = new URLSearchParams();
      body.set('f.req', fReq);
      body.set('at', 'AHGM0bVQ0AKqbZcpE4PGnmHYtvg4:1744623569088');

      const googleRes = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Origin: 'https://translate.google.com',
          Referer: 'https://translate.google.com/',
        },
        credentials: 'include',
        body: body.toString(),
      });

      const text = await googleRes.text();
      const batches = text.split('\n').filter((row) => row.startsWith('[['));
      const translatedString = batches.reduce((a, b) => (a.length >= b.length ? a : b));

      let data: any[] = [];
      try {
        data = JSON.parse(translatedString);
      } catch (err) {
        console.error('Failed to parse response:', err);
      }

      const raw = data[0]?.[2];

      let translated = '';
      if (typeof raw === 'string') {
        const rawList = JSON.parse(raw);
        const filteredList = rawList.flat(Infinity).filter((i: any) => {
          return i !== null && typeof i === 'string' && i !== sentence && i !== 'en' && i !== 'de' && !sentence.includes(i);
        });
        translated = filteredList.join(' ');
      }

      res.json({ translated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Translation proxy error' });
    }
  });

  app.post('/api/confirm-translation', async (req: Request, res: Response) => {
    const { english, german } = req.body as { english?: string; german?: string };
    if (!english || !german) return res.status(400).json({ error: 'Missing english/german body params' });

    const prompt = `
You are a strict but fair German translation evaluator.

Your job is to determine whether the following German sentence is:
1. Grammatically correct (including case, verb form, word order, spelling, etc.)
2. A faithful and natural-sounding translation of the English sentence

You MUST enforce correct spelling and grammar.
You MUST accept the following variations **as correct**:
- Gender differences in nouns (e.g., "Lehrer" vs "Lehrerin") if they preserve meaning
- Lowercase German nouns (like "schüler") if they are clearly identifiable and correctly spelled — treat this as a formatting issue, not a grammar error
- Word order variations that are natural and grammatically valid
- Idiomatic or natural German phrasing if it conveys the same meaning
- Ignore differences in capitalization and punctuation

---
Example:
English: "The teacher named all the students one by one."
German: "Die Lehrerin nannte alle schüler nacheinander."
→ true

---
Now evaluate:

English: "${english}"
German: "${german}"

Respond only with:
true
or
false
`;

    try {
      console.log('English', english);
      console.log('German', german);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.0,
          max_tokens: 5,
        }),
      });

      const data = await response.json();
      console.log('data', data);
      const errorCode = data?.error?.code;
      if (errorCode) {
        console.error('OpenAI API Error:', errorCode);
        return res.status(500).json({ error: 'OpenAI API error' });
      }

      const text = data.choices?.[0]?.message?.content?.trim().toLowerCase();
      console.log('message', data.choices?.[0]?.message);
      res.json({ isCorrect: text === 'true' });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Translation check failed' });
    }
  });
}
