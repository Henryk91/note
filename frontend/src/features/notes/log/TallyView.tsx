import React from 'react';
import {
  dayKeyOf,
  formatDayLong,
  formatDuration,
  formatTime,
  groupByDay,
  LogEntry,
  tallyStats,
  usualGapMs,
} from './logModel';

type TallyViewProps = {
  entries: LogEntry[];
  codes: string[];
  nowTs: number;
  editingId?: string;
  onCode: (code: string) => void;
  onEdit: (entry: LogEntry) => void;
};

const label = (day: string, todayKey: string) => {
  const y = dayKeyOf(new Date(todayKey + 'T12:00:00').getTime() - 86400000);
  if (day === todayKey) return 'Today';
  if (day === y) return 'Yesterday';
  return formatDayLong(day);
};

/** Tally log (docs/mockups/phone-screens.html, mockup 3): three tiles, big code buttons, 14-day bars, rows by day. */
export const TallyView: React.FC<TallyViewProps> = ({ entries, codes, nowTs, editingId, onCode, onEdit }) => {
  const today = dayKeyOf(nowTs);
  const stats = tallyStats(entries, today, nowTs, 14);
  const gap = usualGapMs(entries, nowTs);
  const max = Math.max(1, ...stats.perDay.map((d) => d.count));
  const { days, byDay } = groupByDay(entries);
  const shown = [...days].reverse().slice(0, 7);

  return (
    <div className="tally-view" data-testid="tally-view">
      <div className="tally-tiles">
        <div className="summary-tile is-center">
          <div>Today</div>
          <strong>{stats.countToday}</strong>
        </div>
        <div className="summary-tile is-center">
          <div>Since last</div>
          <strong>{stats.sinceLastMs !== null ? formatDuration(stats.sinceLastMs) : '-'}</strong>
        </div>
        <div className="summary-tile is-center">
          <div>Usual gap</div>
          <strong>{gap !== null ? formatDuration(gap) : '-'}</strong>
        </div>
      </div>
      <div className="tally-buttons" data-testid="tally-buttons">
        {codes.slice(0, 3).map((code, i) => (
          <button type="button" key={code} className={i === 0 ? 'is-primary' : ''} aria-label={`Log ${code}`} onClick={() => onCode(code)}>
            {code}
          </button>
        ))}
      </div>
      {codes.length > 3 && (
        <div className="log-chips">
          {codes.slice(3).map((code) => (
            <button type="button" key={code} aria-label={`Log ${code}`} onClick={() => onCode(code)}>
              {code}
            </button>
          ))}
        </div>
      )}
      <div className="cap">Last 14 days</div>
      <div className="tally-bars" aria-label="Entries per day, last 14 days" data-testid="tally-stats">
        {stats.perDay.map((d, i) => (
          <div
            key={d.day}
            title={`${d.day}: ${d.count}`}
            className={i === stats.perDay.length - 1 ? 'is-today' : ''}
            style={{ height: `${Math.max(3, (d.count / max) * 54)}px` }}
          />
        ))}
      </div>
      {shown.map((day) => (
        <div key={day}>
          <div className="cap">{label(day, today)}</div>
          {[...byDay[day]].reverse().map((e) => (
            <div
              key={e.id}
              role="button"
              tabIndex={0}
              className={`tally-row ${editingId === e.id ? 'is-editing' : ''}`}
              onClick={() => onEdit(e)}
              onKeyDown={(ev) => ev.key === 'Enter' && onEdit(e)}
            >
              <span className="tally-time">{formatTime(e.ts)}</span>
              {e.text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
