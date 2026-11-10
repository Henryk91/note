import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faFolder } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { NoteItemType } from '../../../shared/utils/Helpers/types';
import { ItemMenu } from '../edit/ItemMenu';
import { buildEntries, firstLine, formatDuration } from '../log/logModel';
import { DRAG_TYPE } from './FolderTree';

type Card = {
  item: NoteItemType;
  title: string;
  preview: string;
  count: number;
  dateTs: number | null;
  isLog: boolean;
};

const shortDate = (ts: number) => {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
};

/** Title, preview (first line of the first block, or the last log entry) and date for each child of a folder. */
export const buildCards = (items: NoteItemType[], byId: Record<string, { dataLable: NoteItemType[] }>): Card[] =>
  items
    .filter((i) => i.type === 'FOLDER')
    .map((item) => {
      const children = byId[item.id]?.dataLable ?? [];
      const isLog = item.name === 'Log';
      let preview = '';
      let dateTs: number | null = null;
      if (isLog) {
        const entries = buildEntries(children);
        const last = entries[entries.length - 1];
        if (last) {
          preview = `${firstLine(last.text)} · ${formatDuration(Date.now() - last.ts)} ago`;
          dateTs = last.ts;
        }
      } else {
        const firstNote = children.find((c) => c.type === 'NOTE');
        preview = firstNote ? firstLine((firstNote.content?.data ?? '').replace(/^#+\s*/, '')) : '';
        const stamps = children
          .map((c) => (c as any).updatedAt ?? (c as any).createdAt)
          .filter(Boolean)
          .map((v: string) => Date.parse(v))
          .filter((v: number) => !Number.isNaN(v));
        dateTs = stamps.length ? Math.max(...stamps) : null;
      }
      return { item, title: item.name || item.heading || 'Untitled', preview, count: children.length, dateTs, isLog };
    });

type ListPaneProps = {
  title: string;
  items: NoteItemType[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onMove: (item: NoteItemType) => void;
  onDelete: (item: NoteItemType) => void;
  onNew: () => void;
  headerExtra?: React.ReactNode;
};

export const ListPane: React.FC<ListPaneProps> = ({ title, items, selectedId, onSelect, onOpen, onMove, onDelete, onNew, headerExtra }) => {
  const byId = useSelector((state: RootState) => state.person.byId);
  const cards = React.useMemo(() => buildCards(items, byId as any), [items, byId]);
  const listRef = useRef<HTMLDivElement>(null);

  // Up / down move through the list; Enter opens the selected folder.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
      if (!cards.length) return;
      const idx = cards.findIndex((c) => c.item.id === selectedId);
      if (e.key === 'Enter') {
        if (idx > -1 && el?.tagName !== 'BUTTON') onOpen(cards[idx].item.id);
        return;
      }
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? Math.min(cards.length - 1, idx + 1) : Math.max(0, idx < 0 ? 0 : idx - 1);
      onSelect(cards[next].item.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards, selectedId, onSelect, onOpen]);

  return (
    <div className="list-pane">
      <div className="list-pane-head">
        <h2>{title}</h2>
        <button type="button" className="list-new" aria-label="New note" title="New note (Ctrl/Cmd+N)" onClick={onNew}>
          +
        </button>
        {headerExtra}
      </div>
      <div className="list-pane-count">{cards.length} {cards.length === 1 ? 'item' : 'items'}</div>
      <div className="list-pane-items" ref={listRef} role="listbox" aria-label="Notes in this folder">
        {cards.length === 0 && <div className="list-empty">Nothing here yet. Use + for a new note.</div>}
        {cards.map((c) => (
          <div
            key={c.item.id}
            role="option"
            aria-selected={selectedId === c.item.id}
            tabIndex={0}
            draggable={!c.isLog}
            className={`list-card ${selectedId === c.item.id ? 'is-selected' : ''}`}
            data-testid="list-card"
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(c.item));
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => onSelect(c.item.id)}
            onDoubleClick={() => onOpen(c.item.id)}
          >
            <FontAwesomeIcon icon={c.isLog ? faClock : faFolder} className="list-card-icon" />
            <div className="list-card-body">
              <div className="list-card-title">{c.title}</div>
              <div className="list-card-sub">
                {c.dateTs !== null && <span className="list-card-date">{shortDate(c.dateTs)}</span>}
                <span className="list-card-preview">{c.preview || (c.count ? `${c.count} items` : 'Empty')}</span>
              </div>
            </div>
            {c.count > 0 && <span className="list-card-count">{c.count}</span>}
            <ItemMenu
              label={`Actions for ${c.title}`}
              items={[
                { label: 'Open', onSelect: () => onOpen(c.item.id) },
                ...(c.isLog ? [] : [{ label: 'Move to...', onSelect: () => onMove(c.item) }]),
                { label: 'Delete', danger: true, onSelect: () => onDelete(c.item) },
              ]}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
