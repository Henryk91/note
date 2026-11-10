import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { addDaysToKey, dayKeyOf, dayKeyToDate } from './logModel';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

type CalendarProps = {
  selected: string;
  daysWithEntries: Set<string>;
  onPick: (day: string) => void;
  onClose: () => void;
};

/** Month grid with a dot on every day that has entries. */
export const Calendar: React.FC<CalendarProps> = ({ selected, daysWithEntries, onPick, onClose }) => {
  const sel = dayKeyToDate(selected);
  const [view, setView] = useState({ y: sel.getFullYear(), m: sel.getMonth() });
  const todayKey = dayKeyOf(Date.now());

  const first = new Date(view.y, view.m, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: Array<string | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => dayKeyOf(new Date(view.y, view.m, i + 1, 12).getTime())),
  ];

  const move = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1, 12);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div className="log-cal" role="dialog" aria-label="Jump to a day">
      <div className="log-cal-head">
        <button type="button" className="log-icon-btn" aria-label="Previous month" onClick={() => move(-1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <span>
          {MONTHS[view.m]} {view.y}
        </span>
        <button type="button" className="log-icon-btn" aria-label="Next month" onClick={() => move(1)}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
      <div className="log-cal-grid">
        {DOW.map((d) => (
          <span key={d} className="dow">
            {d}
          </span>
        ))}
        {cells.map((key, i) =>
          key ? (
            <button
              type="button"
              key={key}
              className={[
                daysWithEntries.has(key) ? 'has' : '',
                key === selected ? 'sel' : '',
                key === todayKey ? 'today' : '',
              ].join(' ')}
              onClick={() => {
                onPick(key);
                onClose();
              }}
              aria-label={`${key}${daysWithEntries.has(key) ? ', has entries' : ''}`}
            >
              {Number(key.slice(8))}
            </button>
          ) : (
            // eslint-disable-next-line react/no-array-index-key
            <span key={`blank-${i}`} />
          ),
        )}
      </div>
      <div style={{ textAlign: 'right', marginTop: 6 }}>
        <button type="button" onClick={() => { onPick(todayKey); onClose(); }} style={{ color: 'var(--accent-text)', fontSize: 12 }}>
          Today
        </button>
        <button type="button" onClick={onClose} style={{ marginLeft: 12, fontSize: 12 }}>
          Close
        </button>
      </div>
    </div>
  );
};

export { addDaysToKey };
