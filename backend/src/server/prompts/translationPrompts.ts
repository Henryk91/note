// eslint-disable-next-line import/prefer-default-export
export const getVerifyTranslationPrompt = (english: string, german: string) => `
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
