import React, { useEffect } from 'react';
import { NoteItemType } from '../../../shared/utils/Helpers/types';
import { ItemMenu } from '../edit/ItemMenu';
import { noteTitle, notePreview } from '../edit/NoteBlock';
import { DRAG_TYPE } from './FolderTree';

type ListPaneProps = {
  path: string;
  notes: NoteItemType[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onMove: (item: NoteItemType) => void;
  onDelete: (item: NoteItemType) => void;
  onNew: () => void;
  headerExtra?: React.ReactNode;
};

/** The notes of the open folder (docs/mockups/desktop.html): bold title, one-line preview, "N notes". */
export const ListPane: React.FC<ListPaneProps> = ({ path, notes, selectedId, onSelect, onMove, onDelete, onNew, headerExtra }) => {
  // Up / down move through the list.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      if (!notes.length) return;
      e.preventDefault();
      const idx = notes.findIndex((n) => n.id === selectedId);
      const next = e.key === 'ArrowDown' ? Math.min(notes.length - 1, idx + 1) : Math.max(0, idx < 0 ? 0 : idx - 1);
      onSelect(notes[next].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notes, selectedId, onSelect]);

  return (
    <div className="list-pane">
      <div className="list-pane-head">
        {headerExtra}
        <span className="list-pane-path">{path}</span>
        <span className="list-pane-count">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
        <button type="button" className="list-new" aria-label="New note" title="New note" onClick={onNew}>
          +
        </button>
      </div>
      <div className="list-pane-items" role="listbox" aria-label="Notes in this folder">
        {notes.length === 0 && <div className="list-empty">No notes in this folder yet. Use + to write one.</div>}
        {notes.map((n) => {
          const text = n.content?.data ?? '';
          return (
            <div
              key={n.id}
              role="option"
              aria-selected={selectedId === n.id}
              tabIndex={0}
              draggable
              className={`list-card ${selectedId === n.id ? 'is-selected' : ''}`}
              data-testid="list-card"
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(n));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onClick={() => onSelect(n.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(n.id)}
            >
              <div className="list-card-body">
                <div className="list-card-title">{noteTitle(text) || 'New note'}</div>
                <div className="list-card-sub">{notePreview(text)}</div>
              </div>
              <ItemMenu
                label={`Actions for ${noteTitle(text) || 'note'}`}
                items={[
                  { label: 'Move to...', onSelect: () => onMove(n) },
                  { label: 'Delete', danger: true, onSelect: () => onDelete(n) },
                ]}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
