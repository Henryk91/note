import {
  IconArrowUp,
  IconCalendar,
  IconChartBar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconDots,
  IconPlayerPlay,
} from '@tabler/icons-react';
import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useDismiss } from '../edit/useDismiss';
import { getMarkdownText } from '../../../shared/utils/markdown';
import { PanelValue } from './entryTime';
import {
  dayKeyOf,
  entryDuration,
  firstLine,
  formatDayComma,
  formatDuration,
  formatTime,
  isBreakText,
  isLongEntry,
  LogEntry,
  LogMode,
  shortLabel,
  summarizeDay,
  taskBefore,
} from './logModel';
import './desktopLog.css';

/* ---- shared selected day (the days column and the log page talk through this) ----------------------- */

type DayState = { logId: string; day: string } | null;
let dayState: DayState = null;
const dayListeners = new Set<() => void>();
export const setSelectedLogDay = (next: DayState) => {
  dayState = next;
  dayListeners.forEach((l) => l());
};
export const useSelectedLogDay = (logId: string): string | null =>
  useSyncExternalStore(
    (l) => {
      dayListeners.add(l);
      return () => dayListeners.delete(l);
    },
    () => (dayState?.logId === logId ? dayState.day : null),
  );
export const PICK_LOG_DAY_EVENT = 'log-pick-day';

/* ---- page header -------------------------------------------------------------------------------- */

export const DesktopLogHeader: React.FC<{
  kicker: string;
  title: string;
  onSummary?: () => void;
  menu: React.ReactNode;
}> = ({ kicker, title, onSummary, menu }) => (
  <div className="dl-head">
    <div>
      <div className="dl-kick">{kicker}</div>
      <h1 className="dl-h1">{title}</h1>
    </div>
    <div className="dl-head-actions">
      {onSummary && (
        <button type="button" className="dl-btn2" onClick={onSummary}>
          <IconChartBar size={13} /> Day summary
        </button>
      )}
      {menu}
    </div>
  </div>
);

/* ---- day bar ------------------------------------------------------------------------------------ */

export const DesktopDayBar: React.FC<{
  day: string;
  sub: string;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onPickDay: () => void;
  continueText?: string | null;
  onContinue?: () => void;
  todayButton?: (() => void) | null;
}> = ({ day, sub, onPrev, onNext, onPickDay, continueText, onContinue, todayButton }) => (
  <div className="dl-daybar">
    <button type="button" className="dl-ibtn" aria-label="Previous day with entries" disabled={!onPrev} onClick={() => onPrev?.()}>
      <IconChevronLeft size={16} />
    </button>
    <button type="button" className="dl-ibtn" aria-label="Next day with entries" disabled={!onNext} onClick={() => onNext?.()}>
      <IconChevronRight size={16} />
    </button>
    <button type="button" className="dl-date" onClick={onPickDay} aria-label="Pick a day" data-testid="day-label">
      {formatDayComma(day)}
    </button>
    <span className="dl-sub">{sub}</span>
    {todayButton && (
      <button type="button" className="dl-lk" onClick={todayButton}>
        Today
      </button>
    )}
    {continueText && (
      <button type="button" className="dl-cont" onClick={onContinue}>
        <IconPlayerPlay size={13} />
        <span>Continue: {continueText}</span>
      </button>
    )}
  </div>
);

/* ---- timeline table ----------------------------------------------------------------------------- */

const DesktopRow: React.FC<{
  entry: LogEntry;
  index: number;
  dayEntries: LogEntry[];
  nowTs: number;
  breakWords?: string[];
  expandByDefault: boolean;
  isEditing: boolean;
  pending: boolean;
  showContinue: boolean;
  onEdit: (e: LogEntry) => void;
  onContinue: (text: string) => void;
  onCopy: (e: LogEntry) => void;
  onLogAgain: (e: LogEntry) => void;
  onDelete: (e: LogEntry) => void;
}> = ({ entry, index, dayEntries, nowTs, breakWords, expandByDefault, isEditing, pending, showContinue, onEdit, onContinue, onCopy, onLogAgain, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(expandByDefault);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(menuOpen, ref, () => setMenuOpen(false));
  const isBreak = isBreakText(entry.text, breakWords);
  const long = isLongEntry(entry.text);
  const duration = entryDuration(dayEntries, index, nowTs);
  const running = !dayEntries[index + 1] && dayKeyOf(nowTs) === entry.day;
  const prevTask = isBreak && showContinue ? taskBefore(dayEntries, index, breakWords) : null;
  const onText = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) return;
    if (window.getSelection()?.toString()) return;
    onEdit(entry);
  };
  return (
    <div
      ref={ref}
      className={`dl-row ${isBreak ? 'is-break' : ''} ${isEditing ? 'is-editing' : ''} ${menuOpen ? 'is-menu' : ''}`}
      data-testid="log-row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          onDelete(entry);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          onEdit(entry);
        }
      }}
    >
      <button type="button" className="dl-tm" onClick={() => onEdit(entry)} aria-label={`Edit entry at ${formatTime(entry.ts)}: ${firstLine(entry.text)}`}>
        {formatTime(entry.ts)}
        {pending && <IconClock size={12} className="dl-pending" aria-label="Waiting to sync" />}
      </button>
      <div className="dl-entry">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className={`dl-txt ${long && !expanded ? 'is-clamped' : ''}`}
          onClick={onText}
          // Sanitised Markdown, same renderer and options as notes (marked + breaks, then DOMPurify).
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: getMarkdownText(entry.text).__html.trim() }}
        />
        {prevTask && (
          <button type="button" className="dl-pill" onClick={() => onContinue(firstLine(prevTask.text))}>
            Continue {shortLabel(prevTask.text)}
          </button>
        )}
        {long && (
          <button type="button" className="dl-more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
      <span className={`dl-dur ${running ? 'is-running' : ''}`}>{duration === null ? '' : running ? `(${formatDuration(duration)})` : formatDuration(duration)}</span>
      <span className="dl-act-wrap">
        <button type="button" className="dl-act" aria-label="Entry actions" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
          <IconDots size={16} />
        </button>
        {menuOpen && (
          <div className="log-menu dl-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onCopy(entry); }}>
              Copy
            </button>
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onLogAgain(entry); }}>
              Log again now
            </button>
            <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(false); onDelete(entry); }}>
              Delete
            </button>
          </div>
        )}
      </span>
    </div>
  );
};

export const DesktopLogTable: React.FC<
  Omit<React.ComponentProps<typeof DesktopRow>, 'entry' | 'index' | 'isEditing' | 'pending'> & {
    editingId?: string;
    pendingIds: Set<string>;
    empty: string | null;
    listRef: React.RefObject<HTMLDivElement>;
  }
> = ({ dayEntries, editingId, pendingIds, empty, listRef, ...rest }) => (
  <>
    <div className="dl-thead" aria-hidden>
      <span>Time</span>
      <span>Entry</span>
      <span className="dl-r">Duration</span>
      <span />
    </div>
    <div className="dl-list" ref={listRef} data-testid="timeline">
      {empty && <div className="dl-empty">{empty}</div>}
      {dayEntries.map((entry, i) => (
        <DesktopRow key={entry.id} entry={entry} index={i} dayEntries={dayEntries} isEditing={editingId === entry.id} pending={pendingIds.has(entry.id)} {...rest} />
      ))}
    </div>
  </>
);

/* ---- entry bar (always visible) ----------------------------------------------------------------- */

type Unit = 'd' | 'h' | 'min';
const UNIT_NAMES = { d: 'day', h: 'hour', min: 'minute' } as const;

const Stepper: React.FC<{ label: string; unit: Unit; onStep: (u: Unit, d: 1 | -1) => void }> = ({ label, unit, onStep }) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  const hold = (dir: 1 | -1) => {
    timer.current = setTimeout(function repeat() {
      onStep(unit, dir);
      timer.current = setTimeout(repeat, 90);
    }, 450);
  };
  const btn = (dir: 1 | -1) => (
    <button
      type="button"
      aria-label={`One ${UNIT_NAMES[unit]} ${dir < 0 ? 'earlier' : 'later'}`}
      onClick={() => onStep(unit, dir)}
      onPointerDown={() => hold(dir)}
      onPointerUp={stop}
      onPointerLeave={stop}
    >
      {dir < 0 ? '−' : '+'}
    </button>
  );
  return (
    <span className="dl-stp">
      {btn(-1)}
      <span>{label}</span>
      {btn(1)}
    </span>
  );
};

export const DesktopEntryBar: React.FC<{
  text: string;
  onText: (v: string) => void;
  placeholder: string;
  panel: PanelValue;
  panelError: string | null;
  onPanelField: (f: keyof PanelValue, v: string) => void;
  onStep: (u: Unit, d: 1 | -1) => void;
  editing: boolean;
  onResetOrCancel: () => void;
  /** While editing an entry: delete it (asks first). */
  onDeleteEditing?: () => void;
  onSend: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}> = ({ text, onText, placeholder, panel, panelError, onPanelField, onStep, editing, onResetOrCancel, onDeleteEditing, onSend, inputRef }) => {
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '38px';
    el.style.height = `${Math.min(el.scrollHeight + 2, 132)}px`;
  }, [text, inputRef]);
  return (
    <div className="dl-comp">
      <div className="dl-crow dl-crow-1">
        <span className="dl-lbl">{editing ? 'Editing entry at' : 'New entry at'}</span>
        <input
          className="dl-fi dl-fi-date"
          aria-label="Date, dd.mm.yyyy"
          inputMode="numeric"
          value={panel.date}
          onChange={(e) => onPanelField('date', e.target.value)}
        />
        <input
          className="dl-fi dl-fi-time"
          aria-label="Time, 24 hour HH:MM"
          inputMode="numeric"
          value={panel.time}
          onChange={(e) => onPanelField('time', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              onStep('min', 1);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              onStep('min', -1);
            } else if (e.key === 'Enter') onSend();
          }}
        />
        <Stepper label="1 d" unit="d" onStep={onStep} />
        <Stepper label="1 h" unit="h" onStep={onStep} />
        <Stepper label="1 min" unit="min" onStep={onStep} />
        <button type="button" className="dl-lk dl-reset" onClick={onResetOrCancel}>
          {editing ? 'Cancel edit' : 'Reset to now'}
        </button>
        {editing && onDeleteEditing && (
          <button type="button" className="dl-lk dl-delete" onClick={onDeleteEditing}>
            Delete
          </button>
        )}
        {panelError && (
          <span className="dl-err" role="alert">
            {panelError}
          </span>
        )}
      </div>
      <div className="dl-crow dl-crow-2">
        <textarea
          ref={inputRef}
          className="dl-ta"
          rows={1}
          placeholder={placeholder}
          aria-label="Log entry text"
          value={text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (!e.shiftKey || e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button type="button" className="dl-add" onClick={onSend} disabled={!!panelError}>
          {editing ? <IconCheck size={14} /> : <IconArrowUp size={14} />}
          <span>{editing ? 'Save' : 'Add'}</span>
        </button>
      </div>
      <div className="dl-hint">Enter adds · Shift+Enter new line · Esc cancels an edit · [ and ] previous / next day</div>
    </div>
  );
};

/* ---- days column (notes-list style, one row per day with entries) ------------------------------- */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const DaysColumn: React.FC<{
  logId: string;
  path: string;
  days: string[];
  byDay: Record<string, LogEntry[]>;
  mode: LogMode;
  nowTs: number;
  breakWords?: string[];
  onPickCalendar?: () => void;
}> = ({ logId, path, days, byDay, mode, nowTs, breakWords, onPickCalendar }) => {
  const selected = useSelectedLogDay(logId);
  const today = dayKeyOf(nowTs);
  const newestFirst = [...days].sort().reverse();
  let lastMonth = '';
  return (
    <div className="list-pane dl-days" aria-label="Days with entries">
      <div className="dl-days-head">
        <span>{path}</span>
        <span className="dl-days-count">
          {days.length} {days.length === 1 ? 'day' : 'days'}
        </span>
        <button type="button" className="dl-cal" aria-label="Pick a day" onClick={onPickCalendar}>
          <IconCalendar size={16} />
        </button>
      </div>
      <div className="dl-days-list" role="listbox" aria-label="Days">
        {newestFirst.map((d) => {
          const [y, m] = d.split('-').map(Number);
          const month = `${MONTHS[m - 1]} ${y}`;
          const caption = month !== lastMonth ? month : null;
          lastMonth = month;
          const entries = byDay[d] ?? [];
          const count = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
          const meta =
            mode === 'time-tracker'
              ? `${d === today ? 'Today · ' : ''}${formatDuration(summarizeDay(entries, nowTs, breakWords).workedMs)} · ${count}`
              : `${d === today ? 'Today · ' : ''}${count}`;
          return (
            <React.Fragment key={d}>
              {caption && <div className="dl-month">{caption}</div>}
              <button
                type="button"
                role="option"
                aria-selected={selected === d}
                className={`dl-day ${selected === d ? 'is-selected' : ''}`}
                onClick={() => window.dispatchEvent(new CustomEvent(PICK_LOG_DAY_EVENT, { detail: { logId, day: d } }))}
              >
                <div className="dl-day-date">{formatDayComma(d)}</div>
                <div className="dl-day-meta">{meta}</div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
