import { NoteModel, NoteV2Model } from '../models/Notes';
import { NoteDataLabel, NoteAttrs, NoteV2Attrs } from '../types/models';

import config from '../config';

interface TranslationPracticeMap {
  [key: string]: string;
}

interface NestedTranslationMap {
  [heading: string]: TranslationPracticeMap;
}

export class TranslationService {
  async getTranslationPractice(_userId: string) {
    const docs = await NoteModel.find({
      createdBy: 'Henry',
      userId: config.adminUserId,
      heading: config.translationPracticeFolderId,
    });

    if (!docs || docs.length === 0) return {};

    const result = (docs[0].dataLable || []).reduce((acc: TranslationPracticeMap, { tag, data }: NoteDataLabel) => {
      const formatted = data.trim().endsWith('.') ? `${data} ` : `${data}. `;
      if (tag) {
        acc[tag] = acc[tag] ? `${acc[tag]}${formatted}` : formatted;
      }
      return acc;
    }, {});
    return result;
  }

  async getTranslationLevels() {
    const { translationPracticeFolderId, adminUserId } = config;

    const results = await NoteV2Model.aggregate([
      {
        $match: {
          userId: adminUserId,
          parentId: translationPracticeFolderId,
        },
      },
      {
        $lookup: {
          from: 'notes-v2',
          localField: 'id',
          foreignField: 'parentId',
          as: 'children',
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          name: 1,
          'children.name': 1,
        },
      },
    ]);

    const map: Record<string, string[]> = {};
    for (const res of results) {
      map[res.name ?? ''] = (res.children || []).map((c: any) => c.name || '');
    }
    return map;
  }

  async getFullTranslationPractice() {
    const docs = (await NoteModel.find({ createdBy: config.translationPracticeFolderId })) as unknown as NoteAttrs[];
    const result = docs.reduce((acc: NestedTranslationMap, { heading, dataLable }: NoteAttrs) => {
      const nested = (dataLable || []).reduce((noteAcc: TranslationPracticeMap, { tag, data }: NoteDataLabel) => {
        const formatted = data.trim().endsWith('.') ? `${data} ` : `${data}. `;
        if (tag) {
          noteAcc[tag] = noteAcc[tag] ? `${noteAcc[tag]}${formatted}` : formatted;
        }
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
      parentId: config.translationPracticeFolderId,
    });
    if (!levelDoc) return null;

    const subLevelDoc = await NoteV2Model.findOne({
      name: subLevel,
      parentId: levelDoc.id,
    });
    if (!subLevelDoc) return null;

    const docs = (await NoteV2Model.find({
      parentId: subLevelDoc.id,
      type: 'NOTE',
    }).sort({ _id: 1 })) as unknown as NoteV2Attrs[];

    const english = this.splitSentences(docs[0]?.content?.data ?? '');
    const german = docs.length > 1 ? this.splitSentences(docs[1]?.content?.data ?? '') : [];

    const englishSentences = english.map((sentence, index) => ({
      sentence,
      translation: german[index] || '',
    }));
    return englishSentences;
  }

  async translateText(sentence: string) {
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
    if (batches.length === 0) return '';

    const translatedString = batches.reduce((a, b) => (a.length >= b.length ? a : b));

    let data: unknown[] = [];
    try {
      data = JSON.parse(translatedString) as unknown[];
    } catch (err) {
      console.error('Failed to parse response:', err);
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
        console.error('Failed to parse raw translation list:', err);
      }
    }
    return translated;
  }

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
