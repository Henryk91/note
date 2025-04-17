/* eslint-disable func-names */
const cors = require('cors');
const fetch = require("node-fetch");

module.exports = function (app) {
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
      const clean = text.replace(/^[^\[]+/, '');
  
      const lastIndex = clean.lastIndexOf("]]")
      const cleaner = clean.slice(0, lastIndex)
      const lastIndexB = cleaner.lastIndexOf("]]")
      const cleanest = cleaner.slice(0, lastIndexB+2)
  
      let data = [];
      try {
        data = JSON.parse(cleanest);
      } catch (err) {
        console.error('Failed to parse response:', err);
      }
  
      // Extract the translated sentence
      const raw = data[0]?.[2];
  
      let translated = '';
      if (typeof raw === 'string') {
          const rawList = JSON.parse(raw)
          const filteredList = rawList.flat(Infinity).filter((i) => {
              return i !== null && typeof i === 'string' && i !== sentence && i !== 'en' && i !== 'de'
          } )
          translated = filteredList.toString();
      }
      
      res.json({ translated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Translation proxy error' });
    }
  });  
};
