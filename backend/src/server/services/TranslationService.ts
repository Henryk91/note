import { NoteModel, NoteV2Model } from '../models/Notes';
import { Callback, NoteDataLabel } from '../types/models';
import { docId } from '../utils';

export class TranslationService {
  async getTranslationPractice(userId: string) {
    const docs = await NoteModel.find({
      createdBy: 'Henry',
      userId: 'UUvFcBXO6Q', // Legacy hardcoded ID? ported from handlers
      heading: 'TranslationPractice',
    });
    // If no docs, docs[0] will throw. Need safety.
    if (!docs || docs.length === 0) return {};

    const result = docs[0].dataLable?.reduce((acc: Record<string, string>, { tag, data }: NoteDataLabel) => {
      const formatted = data.trim().endsWith('.') ? `${data} ` : `${data}. `;
      if (tag) {
        acc[tag] = acc[tag] ? `${acc[tag]}${formatted}` : formatted;
      }
      return acc;
    }, {});
    return result ?? {};
  }

  async getTranslationLevels(userId: string) {
    // Logic from handlers.ts getTranslationLevels
    // It calls getOneLevelDown hardcoded.
    // We need to access getOneLevelDown. It was in Handler.
    // We moved it to NoteService.
    // Should we duplicate, call NoteService, or move common logic?
    // Since it's specific, I'll allow duplicating the tree fetching or use NoteService logic if I can import it.
    // But circular dependency risk if I import noteService here and noteService imports this.
    // Usage of getOneLevelDown is generic.
    // I will duplicate the specific tree logic for now to avoid coupling, or move tree logic to a TreeService.
    // Given scope, I'll copy the logic but using models directly.

    const rootParentId = 'TranslationPractice';
    const rootUserId = '68988da2b947c4d46023d679'; // Legacy hardcoded from handlers

    const level1 = await NoteV2Model.find({
      userId: rootUserId,
      parentId: rootParentId,
    }).sort({ _id: 1 });

    const level1Ids = level1.map((n) => n.id);
    const level2 = await NoteV2Model.find({
      userId: rootUserId,
      parentId: { $in: level1Ids },
    }).sort({ _id: 1 });

    // Structuring result as handlers did
    const map: any = {};
    // This logic in handler seemed to return a map of Heading -> [Names]
    // handlers.ts lines 398-403
    /*
        const levels = Object.fromEntries(
        Object.keys(docs).map((key) => [
          docs[key].heading,
          docs[key].dataLable.map((d) => d.name),
        ]),
      );
      */
    // Doing it manually to match output
    for (const l1 of level1) {
      const children = level2.filter((l2) => l2.parentId === l1.id);
      map[l1.name ?? ''] = children.map((c) => c.name);
    }
    return map;
  }

  async getFullTranslationPractice() {
    const docs = await NoteModel.find({ createdBy: 'TranslationPractice' });
    const result = docs.reduce((acc: any, { heading, dataLable }: any) => {
      const nested = dataLable.reduce((noteAcc: any, { tag, data }: any) => {
        const formatted = data.trim().endsWith('.') ? `${data} ` : `${data}. `;
        noteAcc[tag] = noteAcc[tag] ? `${noteAcc[tag]}${formatted}` : formatted;
        return noteAcc;
      }, {});

      acc[heading] = nested;
      return acc;
    }, {});
    return result;
  }

  private splitSentences(input: string) {
    return input
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async getSavedTranslation(level: string, subLevel: string) {
    const levelDoc = await NoteV2Model.findOne({
      name: level,
      parentId: 'TranslationPractice',
    });
    if (!levelDoc) return null;

    const subLevelDoc = await NoteV2Model.findOne({
      name: subLevel,
      parentId: levelDoc.id,
    });
    if (!subLevelDoc) return null;

    const docs = await NoteV2Model.find({
      parentId: subLevelDoc.id,
      type: 'NOTE',
    }).sort({ _id: 1 });

    const english = this.splitSentences(docs[0]?.content?.data ?? '');
    const german = docs.length > 1 ? this.splitSentences(docs[1]?.content?.data ?? '') : [];

    const englishSentences = english.map((sentence, index) => ({
      sentence,
      translation: german[index] || '',
    }));
    return englishSentences;
  }

  // Moved from routes/translate.ts
  async translateText(sentence: string) {
    // Google Translate Proxy Logic
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
    // Hardcoded 'at' token from source
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
        return (
          i !== null && typeof i === 'string' && i !== sentence && i !== 'en' && i !== 'de' && !sentence.includes(i)
        );
      });
      translated = filteredList.join(' ');
    }
    return translated;
  }

  // Moved from routes/translate.ts
  async verifyTranslation(english: string, german: string) {
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
    const errorCode = data?.error?.code;
    if (errorCode) {
      throw new Error(`OpenAI API Error: ${errorCode}`);
    }
    const text = data.choices?.[0]?.message?.content?.trim().toLowerCase();
    return text === 'true';
  }
}

export const translationService = new TranslationService();
