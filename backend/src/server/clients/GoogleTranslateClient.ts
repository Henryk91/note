import logger from '../utils/logger';
import config from '../config';

export interface GoogleTranslateClient {
  translateText(sentence: string): Promise<string>;
}

export class GoogleTranslateClientImpl implements GoogleTranslateClient {
  async translateText(sentence: string): Promise<string> {
    if (!config.googleTranslateToken) return '';

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
    body.set('at', config.googleTranslateToken);

    try {
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

      if (!googleRes.ok) {
        logger.error({ status: googleRes.status }, 'Google Translate API request failed');
        return '';
      }

      const text = await googleRes.text();
      const batches = text.split('\n').filter((row) => row.startsWith('[['));
      if (batches.length === 0) return '';

      const translatedString = batches.reduce((a, b) => (a.length >= b.length ? a : b));

      let data: unknown[] = [];
      try {
        data = JSON.parse(translatedString) as unknown[];
      } catch (err) {
        logger.error({ err }, 'Translation parsing error');
        return '';
      }

      const raw = (data[0] as unknown[])?.[2] as string | undefined;
      let translated = '';
      if (typeof raw === 'string') {
        try {
          const rawList = JSON.parse(raw) as unknown[];
          const filteredList = rawList
            .flat(Infinity)
            .filter(
              (i: unknown): i is string =>
                typeof i === 'string' &&
                i.length > 0 &&
                i !== sentence &&
                i !== 'en' &&
                i !== 'de' &&
                !sentence.includes(i),
            );
          translated = filteredList.join(' ');
        } catch (err) {
          logger.error({ err }, 'Failed to parse raw translation list');
        }
      }
      return translated;
    } catch (error) {
      logger.error({ error }, 'Google Translate API request threw error');
      return '';
    }
  }
}

export const googleTranslateClient = new GoogleTranslateClientImpl();
