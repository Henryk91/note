import { NoteItemType } from '../../../shared/utils/Helpers/types';

/**
 * Pure helpers for the log screen. Dates are stored either as old `Date.toString()` text or as ISO 8601 with offset;
 * both are read with `Date.parse`, once, and everything else works on the parsed timestamp.
 */

export type LogMode = 'time-tracker' | 'tally' | 'daily-value' | 'journal';

export type LogSettings = {
  mode?: LogMode;
  pinned?: boolean;
  breakWords?: string[];
  chips?: string[];
};

export type LogEntry = {
  id: string;
  text: string;
  /** epoch ms */
  ts: number;
  /** local day, YYYY-MM-DD */
  day: string;
  raw: NoteItemType;
};

export const DEFAULT_BREAK_WORDS = ['break', 'pause', 'lunch'];
export const MINUTE = 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

const parsedCache = new Map<string, number | null>();

export const parseLogDate = (value?: string | null): number | null => {
  if (!value) return null;
  if (parsedCache.has(value)) return parsedCache.get(value) ?? null;
  const ts = Date.parse(value);
  const result = Number.isNaN(ts) ? null : ts;
  if (parsedCache.size > 20000) parsedCache.clear();
  parsedCache.set(value, result);
  return result;
};

export const dayKeyOf = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Local noon of a day key (safe against DST shifts when adding days). */
export const dayKeyToDate = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
};

export const addDaysToKey = (key: string, n: number): string => {
  const d = dayKeyToDate(key);
  d.setDate(d.getDate() + n);
  return dayKeyOf(d.getTime());
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `Tue 10 Nov 2026` */
export const formatDayLong = (key: string): string => {
  const d = dayKeyToDate(key);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** `Mon 9 Nov` (header of a day inside the current year is still shown with the year elsewhere) */
/** `Tue, 10 Nov 2026` (the log screen's day title and time line). */
export const formatDayComma = (key: string): string => {
  const d = dayKeyToDate(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDayShort = (key: string): string => {
  const d = dayKeyToDate(key);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** `10.11.2026` */
export const formatDateDE = (ts: number): string => {
  const d = new Date(ts);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

export const toIsoWithOffset = (ts: number): string => {
  const d = new Date(ts);
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:` +
    `${pad(d.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
};

export const formatDuration = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / MINUTE));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

/** The duration shown in brackets in the old UI, `(06:41)`. */
export const formatGap = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / MINUTE));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

// ---- entries ----------------------------------------------------------------------------------------

/** Never relies on array order: entries are sorted by the parsed date. Items without a usable date are dropped. */
export const buildEntries = (items: NoteItemType[] | undefined | null): LogEntry[] => {
  const result: LogEntry[] = [];
  (items ?? []).forEach((item) => {
    const ts = parseLogDate(item?.content?.date);
    if (ts === null) return;
    result.push({ id: item.id, text: item.content?.data ?? '', ts, day: dayKeyOf(ts), raw: item });
  });
  result.sort((a, b) => a.ts - b.ts || a.id.localeCompare(b.id));
  return result;
};

export type GroupedEntries = { days: string[]; byDay: Record<string, LogEntry[]> };

export const groupByDay = (entries: LogEntry[]): GroupedEntries => {
  const byDay: Record<string, LogEntry[]> = {};
  entries.forEach((e) => {
    if (!byDay[e.day]) byDay[e.day] = [];
    byDay[e.day].push(e);
  });
  return { days: Object.keys(byDay).sort(), byDay };
};

/** Previous / next day that has entries, from any day (also from an empty day such as today). */
export const adjacentDay = (days: string[], current: string, dir: 'prev' | 'next'): string | null => {
  if (dir === 'prev') {
    for (let i = days.length - 1; i >= 0; i -= 1) if (days[i] < current) return days[i];
    return null;
  }
  for (let i = 0; i < days.length; i += 1) if (days[i] > current) return days[i];
  return null;
};

// ---- text helpers -----------------------------------------------------------------------------------

export const firstLine = (text: string): string => (text.split('\n')[0] ?? '').trim();

export const normalizeWord = (text: string): string => text.trim().toLowerCase();

export const isBreakText = (text: string, words: string[] = DEFAULT_BREAK_WORDS): boolean =>
  words.map(normalizeWord).includes(normalizeWord(text));

export const isStopText = (text: string): boolean => normalizeWord(text) === 'stop';

export const isNoWork = (text: string, words: string[] = DEFAULT_BREAK_WORDS): boolean =>
  isBreakText(text, words) || isStopText(text);

const TICKET = /^[A-Z][A-Z0-9]+-\d+/;

/** `DEV-244` for ticket entries, otherwise the first line. */
export const taskKey = (text: string): string => {
  const line = firstLine(text);
  const m = line.match(TICKET);
  return m ? m[0] : line;
};

/** Short chip label: a ticket key, or the first line cut to ~12 characters. */
export const shortLabel = (text: string): string => {
  const key = taskKey(text);
  return key.length > 14 ? `${key.slice(0, 13)}...` : key;
};

export const isLongEntry = (text: string): boolean => text.split('\n').length > 8 || text.length > 420;

// ---- continue ---------------------------------------------------------------------------------------

/** The last non-break, non-stop entry of the day: what "Continue" at the top picks. */
export const lastTask = (dayEntries: LogEntry[], words?: string[]): LogEntry | null => {
  for (let i = dayEntries.length - 1; i >= 0; i -= 1) {
    if (!isNoWork(dayEntries[i].text, words)) return dayEntries[i];
  }
  return null;
};

/** For a break row: the entry just before the break that was real work. */
export const taskBefore = (dayEntries: LogEntry[], index: number, words?: string[]): LogEntry | null => {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (!isNoWork(dayEntries[i].text, words)) return dayEntries[i];
  }
  return null;
};

// ---- durations and summaries ------------------------------------------------------------------------

/** Time until the next entry of the same day; the last entry of today runs until `nowTs`. */
export const entryDuration = (dayEntries: LogEntry[], index: number, nowTs: number): number | null => {
  const entry = dayEntries[index];
  const next = dayEntries[index + 1];
  if (next) return next.ts - entry.ts;
  // A Stop at the end of today does not keep running.
  if (dayKeyOf(nowTs) === entry.day && nowTs >= entry.ts && !isStopText(entry.text)) return nowTs - entry.ts;
  return null;
};

export type DaySummary = {
  startTs: number | null;
  stopTs: number | null;
  workedMs: number;
  byTask: Array<{ key: string; ms: number }>;
  running: LogEntry | null;
};

/** Worked time excludes Break / Pause / Lunch rows and anything from a Stop to the next entry. */
export const summarizeDay = (dayEntries: LogEntry[], nowTs: number, words?: string[]): DaySummary => {
  let workedMs = 0;
  const tasks = new Map<string, number>();
  dayEntries.forEach((e, i) => {
    if (isNoWork(e.text, words)) return;
    const ms = entryDuration(dayEntries, i, nowTs);
    if (ms === null) return;
    workedMs += ms;
    const key = taskKey(e.text);
    tasks.set(key, (tasks.get(key) ?? 0) + ms);
  });
  const stops = dayEntries.filter((e) => isStopText(e.text));
  const last = dayEntries[dayEntries.length - 1];
  const isToday = last ? dayKeyOf(nowTs) === last.day : false;
  return {
    startTs: dayEntries[0]?.ts ?? null,
    stopTs: stops.length ? stops[stops.length - 1].ts : null,
    workedMs,
    byTask: [...tasks.entries()].map(([key, ms]) => ({ key, ms })).sort((a, b) => b.ms - a.ms),
    running: last && isToday && !isNoWork(last.text, words) ? last : null,
  };
};

/** Monday of the week containing `key`. */
export const weekStart = (key: string): string => {
  const d = dayKeyToDate(key);
  const offset = (d.getDay() + 6) % 7;
  return addDaysToKey(key, -offset);
};

export const weekTotals = (
  byDay: Record<string, LogEntry[]>,
  key: string,
  nowTs: number,
  words?: string[],
): Array<{ day: string; workedMs: number }> => {
  const start = weekStart(key);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDaysToKey(start, i);
    return { day, workedMs: byDay[day] ? summarizeDay(byDay[day], nowTs, words).workedMs : 0 };
  });
};

/** Plain text for a timesheet: one line per task plus the total. */
export const daySummaryText = (key: string, summary: DaySummary): string => {
  const lines = [formatDayLong(key)];
  if (summary.startTs !== null) lines.push(`Start: ${formatTime(summary.startTs)}`);
  if (summary.stopTs !== null) lines.push(`Stop: ${formatTime(summary.stopTs)}`);
  summary.byTask.forEach((t) => lines.push(`${t.key}: ${formatDuration(t.ms)}`));
  lines.push(`Total: ${formatDuration(summary.workedMs)}`);
  return lines.join('\n');
};

export const daySummaryCsv = (key: string, summary: DaySummary): string => {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [['date', 'task', 'minutes'].join(',')];
  summary.byTask.forEach((t) => rows.push([key, esc(t.key), String(Math.round(t.ms / MINUTE))].join(',')));
  rows.push([key, 'TOTAL', String(Math.round(summary.workedMs / MINUTE))].join(','));
  return rows.join('\n');
};

// ---- chips, tally, daily value ----------------------------------------------------------------------

/** Distinct recent ticket entries (full first line), newest first. */
export const recentTickets = (entries: LogEntry[], count = 4, words?: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (let i = entries.length - 1; i >= 0 && result.length < count; i -= 1) {
    const text = firstLine(entries[i].text);
    if (text && !isNoWork(text, words) && TICKET.test(text)) {
      const key = taskKey(text);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(text);
      }
    }
  }
  return result;
};

export const DEFAULT_CHIPS = ['Break', 'Lunch', 'Standup', 'Stop'];

/** Distinct codes of a tally log, most used first. */
export const tallyCodes = (entries: LogEntry[], max = 8): string[] => {
  const counts = new Map<string, number>();
  entries.forEach((e) => {
    const code = e.text.trim();
    if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([code]) => code);
};

export type TallyStats = {
  countToday: number;
  sinceLastMs: number | null;
  avgGapMs: number | null;
  perDay: Array<{ day: string; count: number }>;
};

export const tallyStats = (entries: LogEntry[], day: string, nowTs: number, daysBack = 30): TallyStats => {
  const { byDay } = groupByDay(entries);
  const dayEntries = byDay[day] ?? [];
  const last = entries.filter((e) => e.ts <= nowTs).pop();
  let gapSum = 0;
  for (let i = 1; i < dayEntries.length; i += 1) gapSum += dayEntries[i].ts - dayEntries[i - 1].ts;
  return {
    countToday: dayEntries.length,
    sinceLastMs: last ? nowTs - last.ts : null,
    avgGapMs: dayEntries.length > 1 ? gapSum / (dayEntries.length - 1) : null,
    perDay: Array.from({ length: daysBack }, (_, i) => {
      const d = addDaysToKey(day, i - (daysBack - 1));
      return { day: d, count: byDay[d]?.length ?? 0 };
    }),
  };
};

export type DailyValueInfo = {
  previousValue: string | null;
  loggedToday: boolean;
  streak: number;
  trend: Array<{ day: string; value: string }>;
};

export const dailyValueInfo = (entries: LogEntry[], today: string): DailyValueInfo => {
  const { days, byDay } = groupByDay(entries);
  const lastOf = (d: string) => byDay[d][byDay[d].length - 1].text.trim();
  const before = days.filter((d) => d < today);
  const loggedToday = !!byDay[today];
  let streak = 0;
  let cursor = loggedToday ? today : addDaysToKey(today, -1);
  while (byDay[cursor]) {
    streak += 1;
    cursor = addDaysToKey(cursor, -1);
  }
  return {
    previousValue: before.length ? lastOf(before[before.length - 1]) : null,
    loggedToday,
    streak,
    trend: days.slice(-14).map((d) => ({ day: d, value: lastOf(d) })),
  };
};

const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Default display mode picked from the data; `settings.mode` overrides it. */
export const detectMode = (entries: LogEntry[]): LogMode => {
  if (entries.length < 3) return 'journal';
  const { days, byDay } = groupByDay(entries);
  const perDay = days.map((d) => byDay[d].length);
  const medianLen = median(entries.map((e) => e.text.trim().length));
  const distinct = new Set(entries.map((e) => e.text.trim())).size;
  const multiDay = perDay.filter((n) => n > 1).length / days.length;
  const avgPerDay = entries.length / days.length;
  const hasWorkWords = entries.some((e) => /^(start|stop|break|lunch|standup)$/i.test(e.text.trim()));

  if (hasWorkWords && avgPerDay >= 4) return 'time-tracker';
  if (medianLen <= 4 && distinct <= 10 && multiDay >= 0.4) return 'tally';
  if (multiDay <= 0.1 && medianLen <= 16 && days.length >= 3) return 'daily-value';
  if (avgPerDay >= 6 && medianLen <= 40) return 'time-tracker';
  return 'journal';
};

// ---- pinned card (notebook home) ---------------------------------------------------------------------

export type PinnedStats = { value: string; sub: string };

/** The two lines of a pinned-log card, e.g. `4h 31m` / `DEV-313 running` or `2 today` / `Last P at 11:15`. */
export const pinnedStats = (entries: LogEntry[], mode: LogMode, nowTs: number, words?: string[]): PinnedStats => {
  const today = dayKeyOf(nowTs);
  const todays = entries.filter((e) => e.day === today);
  if (mode === 'time-tracker') {
    if (!todays.length) return { value: '-', sub: 'No entries today' };
    const s = summarizeDay(todays, nowTs, words);
    return { value: formatDuration(s.workedMs), sub: s.running ? `${taskKey(s.running.text)} running` : s.stopTs !== null ? 'Stopped' : 'Not running' };
  }
  if (mode === 'tally') {
    const last = todays[todays.length - 1];
    return { value: `${todays.length} today`, sub: last ? `Last ${last.text.trim()} at ${formatTime(last.ts)}` : 'Nothing yet today' };
  }
  if (mode === 'daily-value') {
    const last = todays[todays.length - 1];
    return { value: last ? last.text.trim() : '-', sub: last ? 'Logged today' : 'Not logged yet' };
  }
  const last = entries[entries.length - 1];
  return { value: `${todays.length} today`, sub: last ? firstLine(last.text) : 'No entries' };
};

// ---- summary screen (docs/mockups/phone-screens.html, mockup 2) --------------------------------------

export type TaskRow = { label: string; ms: number; muted: boolean };

/** Rows of "By task": tickets with their latest title, and all non-ticket entries together ("Start, Standup"). */
export const taskRows = (dayEntries: LogEntry[], nowTs: number, words?: string[]): TaskRow[] => {
  const tickets = new Map<string, { title: string; ms: number }>();
  const others = new Map<string, number>();
  dayEntries.forEach((e, i) => {
    if (isNoWork(e.text, words)) return;
    const ms = entryDuration(dayEntries, i, nowTs);
    if (ms === null) return;
    const line = firstLine(e.text);
    const m = line.match(TICKET);
    if (m) {
      const cur = tickets.get(m[0]);
      tickets.set(m[0], { title: line, ms: (cur?.ms ?? 0) + ms });
    } else {
      const name = line.replace(/:$/, '');
      others.set(name, (others.get(name) ?? 0) + ms);
    }
  });
  const rows: TaskRow[] = [...tickets.values()].map((t) => ({ label: t.title, ms: t.ms, muted: false }));
  rows.sort((a, b) => b.ms - a.ms);
  if (others.size) {
    const names = [...others.keys()];
    rows.push({
      label: names.length > 3 ? `${names.slice(0, 3).join(', ')} +${names.length - 3}` : names.join(', '),
      ms: [...others.values()].reduce((a, b) => a + b, 0),
      muted: true,
    });
  }
  return rows;
};

/** Total time of Break / Pause / Lunch rows of a day. */
export const breaksMs = (dayEntries: LogEntry[], nowTs: number, words?: string[]): number =>
  dayEntries.reduce((sum, e, i) => (isBreakText(e.text, words) ? sum + (entryDuration(dayEntries, i, nowTs) ?? 0) : sum), 0);

/** Recent days that have entries (up to `max`, oldest first) with their worked time: "This week and last". */
export const recentDayBars = (
  byDay: Record<string, LogEntry[]>,
  selected: string,
  nowTs: number,
  words?: string[],
  max = 6,
): Array<{ day: string; workedMs: number }> => {
  const days = Object.keys(byDay)
    .filter((d) => d <= selected && d >= addDaysToKey(selected, -13))
    .sort()
    .slice(-max);
  return days.map((day) => ({ day, workedMs: summarizeDay(byDay[day], nowTs, words).workedMs }));
};

/** A Break that ran for hours (until the Stop of the day): probably a missing entry. */
export const findLongBreak = (
  byDay: Record<string, LogEntry[]>,
  selected: string,
  nowTs: number,
  words?: string[],
  thresholdMs = 3 * 60 * MINUTE,
): { day: string; ms: number; untilStop: boolean } | null => {
  const days = Object.keys(byDay)
    .filter((d) => d <= selected && d >= addDaysToKey(selected, -13))
    .sort()
    .reverse();
  for (const day of days) {
    const list = byDay[day];
    for (let i = 0; i < list.length; i += 1) {
      if (!isBreakText(list[i].text, words)) continue; // eslint-disable-line no-continue
      const ms = entryDuration(list, i, nowTs);
      if (ms !== null && ms >= thresholdMs && !(day === dayKeyOf(nowTs) && i === list.length - 1)) {
        return { day, ms, untilStop: !!list[i + 1] && isStopText(list[i + 1].text) };
      }
    }
  }
  return null;
};

/** Average gap between consecutive entries of the same day over the last 14 days ("Usual gap" of a tally log). */
export const usualGapMs = (entries: LogEntry[], nowTs: number): number | null => {
  const from = nowTs - 14 * 24 * 60 * MINUTE;
  const recent = entries.filter((e) => e.ts >= from && e.ts <= nowTs);
  let sum = 0;
  let n = 0;
  for (let i = 1; i < recent.length; i += 1) {
    if (recent[i].day === recent[i - 1].day) {
      sum += recent[i].ts - recent[i - 1].ts;
      n += 1;
    }
  }
  return n ? sum / n : null;
};
