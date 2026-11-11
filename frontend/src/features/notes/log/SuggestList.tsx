import React, { useEffect, useState } from 'react';
import { lastUsedLabel, Suggestion } from './suggest';

export const SUGGEST_LIST_ID = 'log-suggest-list';

/**
 * Keyboard and selection state for the entry box's suggestions. `onKeyDown` returns true when it used the key:
 * ↑/↓ move through the list, Tab (or Enter on a highlighted row) takes a suggestion, Esc closes the list.
 * Enter with nothing highlighted is left to the box (it sends the entry as typed).
 */
export const useSuggestKeys = (items: Suggestion[], text: string, onPick: (text: string) => void) => {
  const [active, setActive] = useState(-1);
  const [closedFor, setClosedFor] = useState<string | null>(null);
  const open = items.length > 0 && closedFor !== text;

  useEffect(() => setActive(-1), [items.length, text]);

  const pick = (s: Suggestion) => {
    onPick(s.text);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent): boolean => {
    if (!open) return false;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = items.length;
      setActive((i) => (e.key === 'ArrowDown' ? (i + 1) % n : (i <= 0 ? n - 1 : i - 1)));
      return true;
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      pick(items[active >= 0 ? active : 0]);
      return true;
    }
    if (e.key === 'Enter' && active >= 0 && !e.shiftKey) {
      e.preventDefault();
      pick(items[active]);
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // close the list first; the next Esc may cancel an edit
      setClosedFor(text);
      return true;
    }
    return false;
  };

  const inputProps = {
    'aria-autocomplete': 'list' as const,
    'aria-expanded': open,
    'aria-controls': open ? SUGGEST_LIST_ID : undefined,
    'aria-activedescendant': open && active >= 0 ? `${SUGGEST_LIST_ID}-${active}` : undefined,
  };

  return { open, active, setActive, pick, onKeyDown, inputProps };
};

/** The list above the entry box: matched part in bold, how often and when last used on the right. */
export const SuggestList: React.FC<{
  items: Suggestion[];
  active: number;
  onHover: (i: number) => void;
  onPick: (s: Suggestion) => void;
  nowTs?: number;
}> = ({ items, active, onHover, onPick, nowTs }) => (
  <ul className="log-suggest" id={SUGGEST_LIST_ID} role="listbox" aria-label="Suggestions">
    {items.map((s, i) => (
      <li
        key={s.text.toLowerCase()}
        id={`${SUGGEST_LIST_ID}-${i}`}
        role="option"
        aria-selected={i === active}
        className={i === active ? 'is-active' : ''}
        // Keep the focus (and the phone keyboard) in the entry box.
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={() => onHover(i)}
        onClick={() => onPick(s)}
      >
        <span className="log-suggest-text">
          {s.text.slice(0, s.match[0])}
          <b>{s.text.slice(s.match[0], s.match[1])}</b>
          {s.text.slice(s.match[1])}
        </span>
        <span className="log-suggest-meta">
          {s.count > 1 ? `${s.count}× · ` : ''}
          {lastUsedLabel(s.lastTs, nowTs)}
        </span>
      </li>
    ))}
  </ul>
);
