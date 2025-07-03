/* eslint-disable func-names */
const cors = require('cors');
const fetch = require("node-fetch");

const Handler = require('../controllers/handlers.js');
const dbHandler = new Handler();

module.exports = function (app) {
  app.options('/api/translate-practice', cors());

  app.get('/api/translate-practice', cors({ origin: '*' }), (req, res) => {
    dbHandler.getTranslationPractice((docs) => {
      res.json(docs);
    });
  });
  app.get('/api/full-translate-practice', cors({ origin: '*' }), (req, res) => {
    dbHandler.getFullTranslationPractice((docs) => {
      res.json(docs);
    });
  });

  app.get('/api/saved-translation', cors({ origin: '*' }), (req, res) => {
    dbHandler.getSavedTranslation(req, (docs) => {
      res.json(docs);
    });
  });
  
  app.options('/api/translate', cors());
  app.post('/api/translate',cors({ origin: '*' }), async (req, res) => {
  // app.post('/api/translate', async (req, res) => {
    const { sentence } = req.body;
    if (!sentence) {
      return res.status(400).json({ error: 'Missing sentence in request body' });
    }
  
    try {
      // Build f.req payload
      const inner = JSON.stringify([[sentence, 'en', 'de', 1], []]);
      const fReq = JSON.stringify([[['MkEWBc', inner, null, 'generic']]]);
  
      // Construct URL with query params
      const url = new URL('https://translate.google.com/_/TranslateWebserverUi/data/batchexecute');
      const params = {
        rpcids: 'MkEWBc',
        'source-path': '/',
        'f.sid': '3888633823004036940',          // may need updating
        bl: 'boq_translate-webserver_20250409.05_p0',
        hl: 'en-US',
        'soc-app': '1',
        'soc-platform': '1',
        'soc-device': '1',
        _reqid: '40663570',
        rt: 'c'
      };
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  
      // Build form-urlencoded body
      const body = new URLSearchParams();
      body.set('f.req', fReq);
      body.set('at', 'AHGM0bVQ0AKqbZcpE4PGnmHYtvg4:1744623569088'); // may need refreshing
  
      // Forward request to Google
      const googleRes = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Origin': 'https://translate.google.com',
          'Referer': 'https://translate.google.com/',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'X-Client-Data': 'CJK2yQEIorbJAQipncoBCOrkygEIlKHLAQiRo8sBCIagzQEI/aXOAQifzs4BCLrnzgEIlujOAQ=='
        },
        credentials: 'include',
        body: body.toString()
      });
  
      const text = await googleRes.text();
      const batches = text.split("\n").filter(row => row.startsWith("[["));
      const translatedString = batches.reduce((a, b) => a.length >= b.length ? a : b);

      let data = [];
      try {
        data = JSON.parse(translatedString);
      } catch (err) {
        console.error('Failed to parse response:', err);
      }
  
      // Extract the translated sentence
      const raw = data[0]?.[2];
  
      let translated = '';
      if (typeof raw === 'string') {
          const rawList = JSON.parse(raw)
          const filteredList = rawList.flat(Infinity).filter((i) => {
              return (
                i !== null && typeof i === 'string' 
                && i !== sentence && i !== 'en' 
                && i !== 'de' && !sentence.includes(i)
              )
          });
          translated = filteredList.join(" ");
      }
      
      res.json({ translated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Translation proxy error' });
    }
  });  

  const allowedOrigins = ['http://localhost:3000', 'https://note.henryk.co.za', 'https://henryk.co.za'];

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error('Blocked by CORS: origin =', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['POST', 'OPTIONS'],
    optionsSuccessStatus: 204, // For legacy browsers
  };

  app.options('/api/confirm-translation', cors(corsOptions));

  app.post('/api/confirm-translation', cors(corsOptions), async (req, res) => {
    const { english, german } = req.body;
    
    const prompt2 = `
        You are a translation evaluator.

        Your job is to check whether a German translation is both:
        - Grammatically correct
        - Faithfully conveys the intended meaning of the English sentence

        You MUST accept idiomatic German expressions — for example, "Abend" may be used instead of "night" when the meaning remains equivalent.

        Ignore punctuation, capitalization, and stylistic differences.
        Remember spelling is very important. And pay attention that all letters are present and that letters with umlauts are used correctly.


        ---
        Example:
        English: "The train, which was delayed by the storm, arrived late at night."
        German: "Der Zug, der durch den Sturm verspätet wurde, kam gestern Abend spät an."
        → true

        ---
        Now evaluate the following:

        English: "${english}"
        German: "${german}"

        Respond only with:
        true
        or
        false
`;

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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
      console.log('data',data);
      const errorCode = data?.error?.code
      if (errorCode) {
        console.error('OpenAI API Error:', errorCode);
        return res.status(500).json({ error: 'OpenAI API error' });
      }

      const text = data.choices?.[0]?.message?.content?.trim().toLowerCase();
      console.log('message',data.choices?.[0]?.message);
      res.json({ isCorrect: text === 'true' });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Translation check failed' });
    }
  });
};
