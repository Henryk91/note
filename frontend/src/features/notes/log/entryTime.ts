import { formatDateDE, formatTime, MINUTE } from './logModel';

export type PanelValue = { date: string; time: string };

export type ParsedPanel = { ok: true; ts: number } | { ok: false; error: string };

/** `dd.mm.yyyy` + `HH:MM` (24 h) to an epoch timestamp, validated. Seconds are kept from `keepSecondsFrom` if given. */
export const parsePanel = (value: PanelValue): ParsedPanel => {
  const m = value.date.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return { ok: false, error: 'Date must be dd.mm.yyyy' };
  const t = value.time.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!t) return { ok: false, error: 'Time must be HH:MM (24 h)' };
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day, Number(t[1]), Number(t[2]), 0, 0);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return { ok: false, error: 'Date must be dd.mm.yyyy' };
  }
  return { ok: true, ts: d.getTime() };
};

export const panelFromTs = (ts: number): PanelValue => ({ date: formatDateDE(ts), time: formatTime(ts) });

/** Steps by whole days, hours or minutes. Crossing midnight, month or year end rolls the date correctly. */
export const stepTs = (ts: number, unit: 'd' | 'h' | 'min', direction: 1 | -1): number => {
  const d = new Date(ts);
  if (unit === 'd') d.setDate(d.getDate() + direction);
  else if (unit === 'h') d.setHours(d.getHours() + direction);
  else d.setTime(d.getTime() + direction * MINUTE);
  return d.getTime();
};

/** The time chip text: always the exact date and time, e.g. `Tue 10 Nov 2026, 14:00`. */
export const chipLabel = (ts: number, dayLong: string): string => `${dayLong}, ${formatTime(ts)}`;

/** On a past day the entry defaults to that day with the current clock time. */
export const defaultTsForDay = (day: string, nowTs: number): number => {
  const now = new Date(nowTs);
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(y, mo - 1, d, now.getHours(), now.getMinutes(), 0, 0).getTime();
};
