import { firstLine } from './logModel';

export type Suggestion = {
  /** The entry's first line, as last written. */
  text: string;
  /** How many entries start with this line (case and outer spaces ignored). */
  count: number;
  /** Time of the most recent of those entries (epoch ms). */
  lastTs: number;
  /** Where the typed text matches inside `text`: [start, end). */
  match: [number, number];
};

type Source = { text: string; ts: number };

/** 0: starts with the query, 1: a word starts with it ("244" in "DEV-244 Fix"), 2: anywhere, -1: no match. */
const matchKind = (lower: string, q: string): { kind: number; at: number } => {
  if (lower.startsWith(q)) return { kind: 0, at: 0 };
  const re = /[\s\-_/:.,()[\]#]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(lower))) {
    const at = m.index + m[0].length;
    if (lower.startsWith(q, at)) return { kind: 1, at };
  }
  const at = lower.indexOf(q);
  return at >= 0 ? { kind: 2, at } : { kind: -1, at: -1 };
};

/**
 * Suggestions for the log entry box: earlier entries of this log (their first line) that match what is typed.
 * Ranked by how they match (start, word start, anywhere), then by use (often and recently used first).
 * Lines that differ only in case or outer spaces ("Break" / "Break ") count as one; the latest spelling is shown.
 * Nothing for an empty box, multi-line text, or when the text already equals a suggestion.
 */
export const suggestEntries = (entries: Source[], typed: string, limit = 5, nowTs = Date.now()): Suggestion[] => {
  const q = typed.trim().toLowerCase();
  if (!q || typed.includes('\n')) return [];

  const byKey = new Map<string, { text: string; count: number; lastTs: number }>();
  entries.forEach((e) => {
    const line = firstLine(e.text);
    if (!line) return;
    const key = line.toLowerCase();
    const cur = byKey.get(key);
    if (!cur) byKey.set(key, { text: line, count: 1, lastTs: e.ts });
    else {
      cur.count += 1;
      if (e.ts >= cur.lastTs) {
        cur.lastTs = e.ts;
        cur.text = line;
      }
    }
  });
  if (byKey.has(q)) return [];

  const DAY = 24 * 60 * 60 * 1000;
  const ranked: Array<Suggestion & { kind: number; score: number }> = [];
  byKey.forEach((v, key) => {
    const { kind, at } = matchKind(key, q);
    if (kind < 0) return;
    // Use: frequency (log scale) plus recency (fades over about a month).
    const ageDays = Math.max(0, (nowTs - v.lastTs) / DAY);
    const score = Math.log2(1 + v.count) + 3 / (1 + ageDays / 7);
    ranked.push({ ...v, match: [at, at + q.length], kind, score });
  });
  ranked.sort((a, b) => a.kind - b.kind || b.score - a.score || b.lastTs - a.lastTs);
  return ranked.slice(0, limit).map(({ text, count, lastTs, match }) => ({ text, count, lastTs, match }));
};

/** "today", "yesterday", "3 d ago", "10 Nov", "10 Nov 2025". */
export const lastUsedLabel = (ts: number, nowTs = Date.now()): string => {
  const d = new Date(ts);
  const now = new Date(nowTs);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} d ago`;
  const month = d.toLocaleString('en-GB', { month: 'short' });
  return d.getFullYear() === now.getFullYear() ? `${d.getDate()} ${month}` : `${d.getDate()} ${month} ${d.getFullYear()}`;
};
