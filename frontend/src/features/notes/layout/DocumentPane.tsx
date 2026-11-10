import { IconCheck } from '@tabler/icons-react';
import React, { useState } from 'react';
import { NoteBlock } from '../edit/NoteBlock';
import { ItemMenu } from '../edit/ItemMenu';
import { ItemMutations, useSaveStatus } from '../edit/itemMutations';
import { NoteItemType } from '../../../shared/utils/Helpers/types';

type DocumentPaneProps = {
  note?: NoteItemType;
  path: string;
  mutations: ItemMutations;
  editToken: number;
  onDelete: (item: NoteItemType, label?: string) => void;
  onMove: (item: NoteItemType) => void;
};

const STATUS = { idle: 'Saved', saving: 'Saving...', saved: 'Saved', offline: 'Offline, will sync' } as const;

/** The editor (docs/mockups/desktop.html): path and "Saved" on top, the note with its title, always editable. */
export const DocumentPane: React.FC<DocumentPaneProps> = ({ note, path, mutations, editToken, onDelete, onMove }) => {
  const status = useSaveStatus();
  const [localToken, setLocalToken] = useState(0);
  if (!note) {
    return (
      <div className="doc-pane">
        <div className="doc-pane-top">
          <span>{path}</span>
        </div>
        <div className="list-empty">Nothing selected. Use + to write a note.</div>
      </div>
    );
  }
  return (
    // "Type anywhere to edit": a click on the empty part of the pane starts editing.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="doc-pane" onClick={(e) => e.target === e.currentTarget && setLocalToken((t) => t + 1)}>
      <div className="doc-pane-top">
        <span>{path}</span>
        <span className="doc-pane-status" role="status" aria-live="polite">
          <IconCheck size={"1em"} /> {STATUS[status]}
        </span>
        <ItemMenu
          label="Note options"
          items={[
            { label: 'Copy', onSelect: () => void navigator.clipboard?.writeText(note.content?.data ?? '') },
            { label: 'Move to...', onSelect: () => onMove(note) },
            { label: 'Delete', danger: true, onSelect: () => onDelete(note, 'Note deleted') },
          ]}
        />
      </div>
      <NoteBlock key={note.id} item={note} asDocument hideMenu mutations={mutations} onDelete={onDelete} editToken={editToken + localToken} />
      <div className="doc-pane-hint">Type anywhere to edit. Delete lives in the ... menu.</div>
    </div>
  );
};
