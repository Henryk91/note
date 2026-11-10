import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { useNotesWithChildren } from '../hooks/useNotesQueries';
import NoteDetailTags from '../components/NoteDetail/NoteDetailTags';
import { SaveIndicator } from '../edit/SaveIndicator';
import { ItemMenu, ItemMenuEntry } from '../edit/ItemMenu';
import { ItemMutations } from '../edit/itemMutations';
import { LogScreen } from '../log/LogScreen';
import { isLogId } from '../log/useLogData';
import { NEW_NOTE_EVENT } from './events';
import { Note, NoteItemType } from '../../../shared/utils/Helpers/types';

type DocumentPaneProps = {
  folderId: string;
  /** Mutations for the folder that contains `folderId` (rename / delete / move of this folder itself). */
  parentMutations: ItemMutations;
  parentId: string;
  isNotebook: boolean;
  onOpenFolder: (item: NoteItemType) => void;
  onDeleteSelf: (item: NoteItemType) => void;
  onMoveSelf: (item: NoteItemType) => void;
};

/** The right-hand pane: the selected note (its blocks, sub-folders and the empty box at the end) or a log. */
export const DocumentPane: React.FC<DocumentPaneProps> = ({
  folderId,
  parentMutations,
  parentId,
  isNotebook,
  onOpenFolder,
  onDeleteSelf,
  onMoveSelf,
}) => {
  const byId = useSelector((state: RootState) => state.person.byId);
  useNotesWithChildren(folderId, !!folderId && !isLogId(folderId));
  const [renaming, setRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRenaming(false), [folderId]);
  // A note that was just created (Ctrl/Cmd+N) starts with its title in rename mode.
  useEffect(() => {
    if (isNotebook) return undefined;
    const start = () => setRenaming(true);
    window.addEventListener(NEW_NOTE_EVENT, start);
    return () => window.removeEventListener(NEW_NOTE_EVENT, start);
  }, [isNotebook]);
  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  if (isLogId(folderId)) return <LogScreen logId={folderId} />;

  const person: Note = (byId[folderId] as Note) ?? ({ id: folderId, heading: '', dataLable: [] } as unknown as Note);
  const own = byId[parentId]?.dataLable?.find((d) => d.id === folderId);
  const title = own?.name || person.heading || folderId.split('::').pop() || '';
  const self = (own ?? { id: folderId, parentId, type: 'FOLDER', name: title, heading: title }) as NoteItemType;

  const commitRename = (value: string) => {
    setRenaming(false);
    const name = value.trim();
    if (name && name !== title) void parentMutations.rename(self, name);
  };

  const menu: ItemMenuEntry[] = isNotebook
    ? []
    : [
        { label: 'Rename', onSelect: () => setRenaming(true) },
        { label: 'Move to...', onSelect: () => onMoveSelf(self) },
        { label: 'Delete', danger: true, onSelect: () => onDeleteSelf(self) },
      ];

  return (
    <div className="doc-pane">
      <div className="doc-pane-head">
        {renaming ? (
          <input
            ref={inputRef}
            className="doc-rename"
            aria-label="Folder name"
            defaultValue={title}
            onBlur={(e) => commitRename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setRenaming(false);
            }}
          />
        ) : (
          <h1 id="personHead" className="nameBox">
            {title || '<NAME NOT SET>'}
          </h1>
        )}
        {menu.length > 0 && <ItemMenu label="Folder options" items={menu} />}
        <SaveIndicator />
      </div>
      <NoteDetailTags
        person={person}
        isLastPage
        hideFolders
        actions={{
          showHideBox: () => undefined,
          saveShowTag: () => undefined,
          continueLog: () => undefined,
          updateNoteItem: () => undefined,
          openFolder: onOpenFolder,
        }}
      />
    </div>
  );
};
