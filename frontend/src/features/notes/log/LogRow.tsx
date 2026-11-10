import { IconClock, IconDots } from '@tabler/icons-react';
import React, { useEffect, useRef, useState } from 'react';
import { useDismiss } from '../edit/useDismiss';
import { getMarkdownText } from '../../../shared/utils/markdown';
import {
  dayKeyOf,
  entryDuration,
  firstLine,
  formatDuration,
  formatTime,
  isBreakText,
  isLongEntry,
  LogEntry,
  shortLabel,
  taskBefore,
} from './logModel';

type LogRowProps = {
  entry: LogEntry;
  index: number;
  dayEntries: LogEntry[];
  nowTs: number;
  breakWords?: string[];
  /** Journal mode shows long entries expanded by default. */
  expandByDefault: boolean;
  isEditing: boolean;
  pending: boolean;
  showContinue: boolean;
  onEdit: (entry: LogEntry) => void;
  onContinue: (text: string) => void;
  onCopy: (entry: LogEntry) => void;
  onLogAgain: (entry: LogEntry) => void;
  onDelete: (entry: LogEntry) => void;
};

const LONG_PRESS_MS = 500;

export const LogRow: React.FC<LogRowProps> = ({
  entry,
  index,
  dayEntries,
  nowTs,
  breakWords,
  expandByDefault,
  isEditing,
  pending,
  showContinue,
  onEdit,
  onContinue,
  onCopy,
  onLogAgain,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(expandByDefault);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useDismiss(menuOpen, rowRef, () => setMenuOpen(false));

  const isBreak = isBreakText(entry.text, breakWords);
  const long = isLongEntry(entry.text);
  const duration = entryDuration(dayEntries, index, nowTs);
  // The last entry of today has no end yet: the mockup shows "running" instead of a growing duration.
  const openEnded = !dayEntries[index + 1] && dayKeyOf(nowTs) === entry.day;
  const prevTask = isBreak && showContinue ? taskBefore(dayEntries, index, breakWords) : null;

  const startPress = () => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const onTextClick = (e: React.MouseEvent) => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if ((e.target as HTMLElement).closest('a')) return; // links stay clickable
    if (window.getSelection()?.toString()) return; // text is being selected
    onEdit(entry);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete(entry);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onEdit(entry);
    }
  };

  return (
    <div
      ref={rowRef}
      className={`log-row ${isBreak ? 'is-break' : ''} ${isEditing ? 'is-editing' : ''}`}
      data-entry-id={entry.id}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onTouchCancel={cancelPress}
    >
      <button type="button" className="log-time" onClick={() => onEdit(entry)} aria-label={`Edit entry at ${formatTime(entry.ts)}: ${firstLine(entry.text)}`}>
        {formatTime(entry.ts)}
      </button>
      <div className="log-body">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className={`log-text swiper-no-swiping ${long && !expanded ? 'is-clamped' : ''}`}
          onClick={onTextClick}
          // Sanitised Markdown, same renderer and options as notes (marked + breaks, then DOMPurify).
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={getMarkdownText(entry.text)}
        />
        {long && (
          <button type="button" className="log-more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
        {prevTask && (
          <div>
            <button type="button" className="log-continue-chip" onClick={() => onContinue(firstLine(prevTask.text))}>
              Continue {shortLabel(prevTask.text)}
            </button>
          </div>
        )}
      </div>
      <div className="log-side">
        {pending && <IconClock size={"1em"} title="Waiting to sync" aria-label="Waiting to sync" />}
        {duration !== null && <span>{openEnded ? 'running' : formatDuration(duration)}</span>}
        <button
          type="button"
          className="log-menu-btn"
          aria-label="Entry actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <IconDots size={20} />
        </button>
      </div>
      {menuOpen && (
        <div className="log-menu" role="menu">
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
    </div>
  );
};
