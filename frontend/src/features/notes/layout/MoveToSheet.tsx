import React, { useState } from 'react';
import { FolderTree } from './FolderTree';
import { NoteItemType } from '../../../shared/utils/Helpers/types';

type MoveToSheetProps = {
  item: NoteItemType;
  notebook: string;
  initiallyOpen: string[];
  onPick: (targetId: string) => void;
  onClose: () => void;
};

/** "Move to..." sheet: pick a destination folder in the current notebook's tree. */
export const MoveToSheet: React.FC<MoveToSheetProps> = ({ item, notebook, initiallyOpen, onPick, onClose }) => {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([notebook, ...initiallyOpen]));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // A folder cannot be moved into itself or below itself.
  const disabled = new Set<string>([item.id]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="log-sheet-backdrop" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="log-sheet move-sheet" role="dialog" aria-label="Move to" onClick={(e) => e.stopPropagation()}>
        <h2>Move &ldquo;{item.name || item.heading || 'item'}&rdquo; to...</h2>
        <FolderTree
          rootId={notebook}
          rootLabel={notebook}
          expandedIds={expanded}
          onToggle={toggle}
          onSelect={(id) => {
            onPick(id);
            onClose();
          }}
          disabledIds={disabled}
        />
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ color: 'var(--muted)', background: 'transparent', border: 0 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
