import React, { useState } from 'react';
import {
  daySummaryCsv,
  daySummaryText,
  DailyValueInfo,
  DaySummary,
  formatDayShort,
  formatDuration,
  formatTime,
  TallyStats,
} from './logModel';

type WorkSummaryProps = {
  day: string;
  summary: DaySummary;
  week: Array<{ day: string; workedMs: number }>;
  onPickDay: (day: string) => void;
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* clipboard unavailable */
  }
};

/** Time tracker: start, stop, worked time, time per ticket, and the week's daily totals. */
export const WorkSummary: React.FC<WorkSummaryProps> = ({ day, summary, week, onPickDay }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="log-summary-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide summary' : 'Day summary and week'}
      </button>
      {open && (
        <div className="log-summary" data-testid="day-summary">
          <table>
            <tbody>
              {summary.startTs !== null && (
                <tr>
                  <td>Start</td>
                  <td>{formatTime(summary.startTs)}</td>
                </tr>
              )}
              {summary.stopTs !== null && (
                <tr>
                  <td>Stop</td>
                  <td>{formatTime(summary.stopTs)}</td>
                </tr>
              )}
              {summary.byTask.map((t) => (
                <tr key={t.key}>
                  <td>{t.key}</td>
                  <td>{formatDuration(t.ms)}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <strong>Total worked</strong>
                </td>
                <td>
                  <strong>{formatDuration(summary.workedMs)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="log-week" aria-label="Week view">
            {week.map((w) => (
              <button type="button" key={w.day} className={w.day === day ? 'sel' : ''} onClick={() => onPickDay(w.day)}>
                <div>{formatDayShort(w.day).slice(0, 3)}</div>
                <div style={{ color: 'var(--text)' }}>{w.workedMs ? formatDuration(w.workedMs) : '-'}</div>
              </button>
            ))}
          </div>
          <div className="log-summary-actions">
            <button type="button" onClick={() => copyText(daySummaryText(day, summary))}>
              Copy as text
            </button>
            <button type="button" onClick={() => copyText(daySummaryCsv(day, summary))}>
              Copy as CSV
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const TallySummary: React.FC<{ stats: TallyStats }> = ({ stats }) => {
  const max = Math.max(1, ...stats.perDay.map((d) => d.count));
  return (
    <div className="log-tally-stats" data-testid="tally-stats">
      Today {stats.countToday}
      {stats.sinceLastMs !== null && <> · last {formatDuration(stats.sinceLastMs)} ago</>}
      {stats.avgGapMs !== null && <> · avg gap {formatDuration(stats.avgGapMs)}</>}
      <div className="log-bars" aria-label="Entries per day, last 30 days">
        {stats.perDay.map((d) => (
          <div key={d.day} title={`${d.day}: ${d.count}`} style={{ height: `${(d.count / max) * 100}%`, opacity: d.count ? 0.9 : 0.2 }} />
        ))}
      </div>
    </div>
  );
};

export const DailyValueSummary: React.FC<{ info: DailyValueInfo }> = ({ info }) => (
  <div className="log-tally-stats" data-testid="daily-stats">
    {info.loggedToday ? '✓ Logged today' : 'Not logged yet today'} · streak {info.streak} {info.streak === 1 ? 'day' : 'days'}
    {info.trend.length > 1 && <div style={{ marginTop: 4, wordBreak: 'break-word' }}>{info.trend.map((t) => t.value).join(' · ')}</div>}
  </div>
);
