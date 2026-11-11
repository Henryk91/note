import { IconCheck } from '@tabler/icons-react';
import React, { useEffect, useRef } from 'react';
import { NoteEditor, NoteEditorHandle } from '../editor/NoteEditor';
import { ItemMutations, useSaveStatus } from '../edit/itemMutations';
import { NoteItemType } from '../../../shared/utils/Helpers/types';

type DocumentPaneProps = {
  note?: NoteItemType;
  /** A new note that is not created yet (created on its first keystroke). */
  draft?: boolean;
  /** Stable editor identity: a draft keeps its editor (and caret) when it gets its id. */
  editorKey?: string;
  folderId: string;
  onCreated?: (id: string) => void;
  path: string;
  mutations: ItemMutations;
  editToken: number;
  onDelete?: (item: NoteItemType, label?: string) => void;
  onMove?: (item: NoteItemType) => void;
};

const STATUS = { idle: 'Saved', saving: 'Saving...', saved: 'Saved', offline: 'Offline, will sync' } as const;

/**
 * The editor (docs/mockups/desktop.html): path and "Saved" on top, the note with its title, always editable.
 * Copy / Move / Delete live in the list card's `...` menu, as in the mockup.
 */
export const DocumentPane: React.FC<DocumentPaneProps> = ({ note, draft, editorKey, folderId, onCreated, path, mutations, editToken }) => {
  const status = useSaveStatus();
  const editor = useRef<NoteEditorHandle>(null);
  useEffect(() => {
    if (editToken) editor.current?.focusTitle();
  }, [editToken]);
  if (!note && !draft) {
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
    <div className="doc-pane">
      <div className="doc-pane-top">
        <span>{path}</span>
        <span className="doc-pane-status" role="status" aria-live="polite">
          <IconCheck size={"1em"} /> {STATUS[status]}
        </span>
      </div>
      <NoteEditor
        key={editorKey ?? note?.id ?? 'draft'}
        ref={editor}
        item={note}
        folderId={folderId}
        mutations={mutations}
        variant="desktop"
        autoFocusTitle={!!draft}
        onCreated={onCreated}
      />
    </div>
  );
};
