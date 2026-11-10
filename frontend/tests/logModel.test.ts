import {
  addDaysToKey,
  adjacentDay,
  buildEntries,
  dailyValueInfo,
  dayKeyOf,
  daySummaryCsv,
  daySummaryText,
  detectMode,
  entryDuration,
  firstLine,
  groupByDay,
  isBreakText,
  lastTask,
  parseLogDate,
  recentTickets,
  shortLabel,
  summarizeDay,
  tallyCodes,
  tallyStats,
  taskBefore,
  taskKey,
  toIsoWithOffset,
  weekTotals,
} from '../src/features/notes/log/logModel';
import { chipLabel, defaultTsForDay, panelFromTs, parsePanel, stepTs } from '../src/features/notes/log/entryTime';
import { ItemType } from '../src/shared/utils/Helpers/types';

const item = (id: string, data: string, date: string) => ({
  id,
  type: ItemType.LOG,
  parentId: 'p',
  content: { data, date },
});
const at = (y: number, mo: number, d: number, h: number, mi: number) => new Date(y, mo - 1, d, h, mi, 0, 0);
const iso = (y: number, mo: number, d: number, h: number, mi: number) => toIsoWithOffset(at(y, mo, d, h, mi).getTime());

// A real exported day (9 Jun 2026, Koorvi / Track): entries are given out of order on purpose.
const REAL_DAY: Array<[string, string]> = [
  ['08:01', 'Start'],
  ['08:21', 'Get dev to work after hot fix'],
  ['09:00', 'Standup'],
  ['09:21', 'Fix check so dhl works on staging'],
  ['10:58', 'Break'],
  ['11:22', 'DEV-127 Staging Bugs: DHL label broken & condition confirmation stuck'],
  ['11:31', 'Meeting: \nBlack Belt of the Month'],
  ['11:40', 'DEV-127 Staging Bugs: DHL label broken & condition confirmation stuck'],
  ['12:14', 'Break'],
  ['12:39', 'Investigate tools to find malware'],
  ['13:39', 'Call with Jan to explain new gcloud login step for functions'],
  ['13:46', 'Investigate tools to find malware'],
  ['14:22', 'DEV-127 Staging Bugs: DHL label broken & condition confirmation stuck'],
  ['15:31', 'Stop'],
];
const realDayItems = () =>
  [...REAL_DAY].reverse().map(([t, text], i) => {
    const [h, m] = t.split(':').map(Number);
    // alternate old Date.toString() and ISO storage formats
    const d = at(2026, 6, 9, h, m);
    return item(`r${i}`, text, i % 2 ? d.toString() : toIsoWithOffset(d.getTime()));
  });

describe('date parsing and grouping', () => {
  test('reads both the old Date.toString() format and ISO with offset', () => {
    const d = at(2026, 11, 10, 6, 57);
    expect(parseLogDate(d.toString())).toBe(d.getTime());
    expect(parseLogDate(toIsoWithOffset(d.getTime()))).toBe(d.getTime());
    expect(parseLogDate('garbage')).toBeNull();
    expect(parseLogDate(undefined)).toBeNull();
  });

  test('sorts by parsed date, never by array order, and drops undated items', () => {
    const entries = buildEntries([
      item('b', 'second', iso(2026, 11, 10, 10, 0)),
      item('a', 'first', at(2026, 11, 10, 9, 0).toString()),
      item('x', 'no date', ''),
    ] as any);
    expect(entries.map((e) => e.text)).toEqual(['first', 'second']);
  });

  test('previous / next day skip empty days and work from an empty day (today)', () => {
    const days = ['2026-11-05', '2026-11-09'];
    expect(adjacentDay(days, '2026-11-10', 'prev')).toBe('2026-11-09');
    expect(adjacentDay(days, '2026-11-09', 'prev')).toBe('2026-11-05');
    expect(adjacentDay(days, '2026-11-05', 'prev')).toBeNull();
    expect(adjacentDay(days, '2026-11-05', 'next')).toBe('2026-11-09');
    expect(adjacentDay(days, '2026-11-09', 'next')).toBeNull();
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('break and continue logic', () => {
  test('matches Break / Pause / Lunch trimmed and case-insensitively, with custom words', () => {
    expect(isBreakText('Break ')).toBe(true);
    expect(isBreakText('break')).toBe(true);
    expect(isBreakText(' LUNCH')).toBe(true);
    expect(isBreakText('Breakfast')).toBe(false);
    expect(isBreakText('Coffee', ['coffee'])).toBe(true);
  });

  test('header continue picks the last non-break entry, not blindly the second to last', () => {
    const day = buildEntries([
      item('1', 'DEV-1 work', iso(2026, 11, 10, 9, 0)),
      item('2', 'Break', iso(2026, 11, 10, 10, 0)),
      item('3', 'Lunch', iso(2026, 11, 10, 10, 30)),
    ] as any);
    expect(lastTask(day)?.text).toBe('DEV-1 work');
    const withStop = buildEntries([
      item('1', 'DEV-1 work', iso(2026, 11, 10, 9, 0)),
      item('2', 'Stop', iso(2026, 11, 10, 10, 0)),
    ] as any);
    expect(lastTask(withStop)?.text).toBe('DEV-1 work');
  });

  test('a break row continues the task just before it', () => {
    const day = buildEntries(realDayItems() as any);
    const { byDay } = groupByDay(day);
    const entries = byDay['2026-06-09'];
    const idx = entries.findIndex((e) => e.text === 'Break');
    expect(taskBefore(entries, idx)?.text).toBe('Fix check so dhl works on staging');
  });

  test('ticket keys and labels', () => {
    expect(taskKey('DEV-244 Migrate database')).toBe('DEV-244');
    expect(taskKey('Standup')).toBe('Standup');
    expect(taskKey('Meeting: \nBlack Belt')).toBe('Meeting:');
    expect(firstLine('Meeting: \nBlack Belt')).toBe('Meeting:');
    expect(shortLabel('DEV-244 Migrate database')).toBe('DEV-244');
    expect(shortLabel('A very long free text entry here')).toBe('A very long f...');
  });

  test('recent ticket chips are distinct by ticket key, newest first', () => {
    const entries = buildEntries([
      item('1', 'DEV-1 first', iso(2026, 11, 10, 9, 0)),
      item('2', 'DEV-2 second', iso(2026, 11, 10, 10, 0)),
      item('3', 'DEV-1 first again', iso(2026, 11, 10, 11, 0)),
      item('4', 'Break', iso(2026, 11, 10, 12, 0)),
    ] as any);
    expect(recentTickets(entries)).toEqual(['DEV-1 first again', 'DEV-2 second']);
  });
});

describe('day summary matches a manual sum of the gaps (real day, 9 Jun 2026)', () => {
  const { byDay } = groupByDay(buildEntries(realDayItems() as any));
  const entries = byDay['2026-06-09'];
  const now = at(2026, 11, 10, 12, 0).getTime();
  const summary = summarizeDay(entries, now);

  test('worked time excludes Break rows and the Stop row: 6h 41m = 401 minutes', () => {
    // manual: 20+39+21+97 + 9+9+34 + 60+7+36+69
    expect(Math.round(summary.workedMs / 60000)).toBe(401);
  });

  test('start, stop and per-ticket time (grouped by ticket key or first line)', () => {
    expect(new Date(summary.startTs!).getHours()).toBe(8);
    expect(new Date(summary.stopTs!).getHours()).toBe(15);
    const by = Object.fromEntries(summary.byTask.map((t) => [t.key, Math.round(t.ms / 60000)]));
    expect(by['DEV-127']).toBe(9 + 34 + 69); // 11:22 to 11:31, 11:40 to 12:14, 14:22 to 15:31
    expect(by['Investigate tools to find malware']).toBe(60 + 36);
    expect(by['Meeting:']).toBe(9);
    expect(summary.running).toBeNull();
  });

  test('text and CSV exports contain the totals', () => {
    expect(daySummaryText('2026-06-09', summary)).toContain('Total: 6h 41m');
    expect(daySummaryCsv('2026-06-09', summary)).toContain('2026-06-09,TOTAL,401');
  });

  test('today: the last open entry runs until now, a stopped day does not', () => {
    const today = buildEntries([
      item('1', 'Start', iso(2026, 11, 10, 8, 0)),
      item('2', 'DEV-1 work', iso(2026, 11, 10, 8, 30)),
    ] as any);
    const nowTs = at(2026, 11, 10, 10, 30).getTime();
    const s = summarizeDay(today, nowTs);
    expect(Math.round(s.workedMs / 60000)).toBe(30 + 120);
    expect(s.running?.text).toBe('DEV-1 work');
    expect(entryDuration(today, 1, nowTs)).toBe(120 * 60000);
    const past = entryDuration(today, 1, at(2026, 11, 11, 10, 30).getTime());
    expect(past).toBeNull();
  });

  test('week totals sum the days of the Monday-based week', () => {
    const week = weekTotals(byDay, '2026-06-09', now);
    expect(week).toHaveLength(7);
    expect(week[0].day).toBe('2026-06-08');
    expect(week[1].day).toBe('2026-06-09');
    expect(Math.round(week[1].workedMs / 60000)).toBe(401);
    expect(week[0].workedMs).toBe(0);
  });
});

describe('modes', () => {
  const mk = (rows: Array<[number, number, string]>) =>
    buildEntries(rows.map(([d, h, t], i) => item(`e${i}`, t, iso(2026, 11, d, h, 0))) as any);

  test('tally log: short codes several times a day', () => {
    const rows: Array<[number, number, string]> = [];
    for (let d = 1; d <= 6; d += 1) ['P', 'V', 'P v2'].forEach((c, k) => rows.push([d, 8 + k * 3, c]));
    const entries = mk(rows);
    expect(detectMode(entries)).toBe('tally');
    expect(tallyCodes(entries)).toEqual(expect.arrayContaining(['P', 'V', 'P v2']));
    const stats = tallyStats(entries, '2026-11-06', at(2026, 11, 6, 20, 0).getTime());
    expect(stats.countToday).toBe(3);
    expect(stats.perDay).toHaveLength(30);
    expect(stats.perDay[29]).toEqual({ day: '2026-11-06', count: 3 });
    expect(Math.round(stats.sinceLastMs! / 3600000)).toBe(6); // last code at 14:00, now 20:00
    expect(Math.round(stats.avgGapMs! / 3600000)).toBe(3);
  });

  test('time tracker: Start / Break / Stop words with many entries a day', () => {
    const rows: Array<[number, number, string]> = [];
    for (let d = 1; d <= 4; d += 1) ['Start', 'DEV-1 work', 'Break', 'DEV-1 work', 'Stop'].forEach((c, k) => rows.push([d, 7 + k, c]));
    expect(detectMode(mk(rows))).toBe('time-tracker');
  });

  test('daily value: one short value a day', () => {
    const rows: Array<[number, number, string]> = [];
    for (let d = 1; d <= 8; d += 1) rows.push([d, 6, `C${30 + d}`]);
    expect(detectMode(mk(rows))).toBe('daily-value');
    const info = dailyValueInfo(mk(rows), '2026-11-09');
    expect(info.previousValue).toBe('C38');
    expect(info.loggedToday).toBe(false);
    expect(info.streak).toBe(8);
  });

  test('journal is the fallback', () => {
    expect(detectMode(mk([[1, 9, 'a long free text entry about the day, with words']]))).toBe('journal');
  });

  test('day key follows the local day', () => {
    expect(dayKeyOf(at(2026, 11, 10, 23, 59).getTime())).toBe('2026-11-10');
  });
});

describe('entry date and time panel', () => {
  test('parses dd.mm.yyyy and 24 h time and rejects invalid input', () => {
    const ok = parsePanel({ date: '10.11.2026', time: '14:20' });
    expect(ok.ok && ok.ts).toBe(at(2026, 11, 10, 14, 20).getTime());
    expect(parsePanel({ date: '31.02.2026', time: '14:20' }).ok).toBe(false);
    expect(parsePanel({ date: '10.11.2026', time: '24:00' }).ok).toBe(false);
    expect(parsePanel({ date: '10.11.2026', time: '2:20 PM' }).ok).toBe(false);
    expect(parsePanel({ date: '2026-11-10', time: '14:20' }).ok).toBe(false);
  });

  test('steppers roll over midnight, month end and year end', () => {
    expect(panelFromTs(stepTs(at(2026, 11, 10, 0, 0).getTime(), 'min', -1))).toEqual({ date: '09.11.2026', time: '23:59' });
    expect(panelFromTs(stepTs(at(2026, 11, 30, 23, 30).getTime(), 'h', 1))).toEqual({ date: '01.12.2026', time: '00:30' });
    expect(panelFromTs(stepTs(at(2026, 12, 31, 12, 0).getTime(), 'd', 1))).toEqual({ date: '01.01.2027', time: '12:00' });
    expect(panelFromTs(stepTs(at(2026, 11, 10, 14, 0).getTime(), 'h', -1))).toEqual({ date: '10.11.2026', time: '13:00' });
  });

  test('chip shows the exact date and time; a past day keeps the current clock time', () => {
    const ts = at(2026, 11, 10, 14, 0).getTime();
    expect(chipLabel(ts, 'Tue 10 Nov 2026')).toBe('Tue 10 Nov 2026, 14:00');
    const past = defaultTsForDay('2026-11-09', at(2026, 11, 10, 14, 5).getTime());
    expect(past).toBe(at(2026, 11, 9, 14, 5).getTime());
  });
});
