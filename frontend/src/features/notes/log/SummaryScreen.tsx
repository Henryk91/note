import { IconAlertTriangle } from '@tabler/icons-react';
import React from 'react';
import {
  breaksMs,
  daySummaryText,
  findLongBreak,
  formatDayLong,
  formatDayShort,
  formatDuration,
  formatTime,
  LogEntry,
  recentDayBars,
  summarizeDay,
  taskRows,
} from './logModel';

type SummaryProps = {
  day: string;
  byDay: Record<string, LogEntry[]>;
  nowTs: number;
  breakWords?: string[];
};

export const summaryCopyText = (day: string, byDay: Record<string, LogEntry[]>, nowTs: number, words?: string[]) =>
  daySummaryText(day, summarizeDay(byDay[day] ?? [], nowTs, words));

/** Work day summary (docs/mockups/phone-screens.html, mockup 2): tiles, by task, week bars, missing-entry warning. */
export const SummaryScreen: React.FC<SummaryProps> = ({ day, byDay, nowTs, breakWords }) => {
  const entries = byDay[day] ?? [];
  const s = summarizeDay(entries, nowTs, breakWords);
  const rows = taskRows(entries, nowTs, breakWords);
  const maxRow = Math.max(1, ...rows.map((r) => r.ms));
  const bars = recentDayBars(byDay, day, nowTs, breakWords);
  const maxBar = Math.max(1, ...bars.map((b) => b.workedMs));
  const warn = findLongBreak(byDay, day, nowTs, breakWords);

  return (
    <div className="summary-screen" data-testid="summary-screen">
      <div className="summary-date">{formatDayLong(day)}</div>
      <div className="summary-tiles">
        <div className="summary-tile">
          <div>Worked</div>
          <strong>{formatDuration(s.workedMs)}</strong>
        </div>
        <div className="summary-tile">
          <div>Breaks</div>
          <strong>{formatDuration(breaksMs(entries, nowTs, breakWords))}</strong>
        </div>
        <div className="summary-tile">
          <div>Started</div>
          <strong>{s.startTs !== null ? formatTime(s.startTs) : '-'}</strong>
        </div>
        <div className="summary-tile">
          <div>Entries</div>
          <strong>{entries.length}</strong>
        </div>
      </div>
      <div className="cap summary-cap-1">By task</div>
      <div className="summary-tasks">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="summary-task-line">
              <span>{r.label}</span>
              <span>{formatDuration(r.ms)}</span>
            </div>
            <div className={`summary-bar ${r.muted ? 'is-muted' : ''}`} style={{ width: `${Math.max(4, (r.ms / maxRow) * 100)}%` }} />
          </div>
        ))}
        {rows.length === 0 && <div className="log-empty">No tracked time on this day.</div>}
      </div>
      <div className="cap summary-cap-2">This week and last</div>
      <div className="summary-week">
        {bars.map((b) => {
          const tiny = b.workedMs < 30 * 60 * 1000;
          return (
            <div key={b.day} className="summary-week-col">
              <div className={`summary-week-bar ${tiny ? 'is-warn' : ''}`} style={{ height: Math.max(4, (b.workedMs / maxBar) * 76) }} title={formatDuration(b.workedMs)} />
              {formatDayShort(b.day).slice(0, 3)} {Number(b.day.slice(8))}
            </div>
          );
        })}
      </div>
      {warn && (
        <div className="summary-warning" role="status">
          <IconAlertTriangle size={"1em"} /> {formatDayShort(warn.day)}: Break ran {formatDuration(warn.ms)}
          {warn.untilStop ? ' until Stop' : ''}. Missing an entry?
        </div>
      )}
    </div>
  );
};
