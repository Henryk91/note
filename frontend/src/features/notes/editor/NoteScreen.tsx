import React, { useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { NoteItemType } from '../../../shared/utils/Helpers/types';
import { useHeader } from '../../../shared/header/headerStore';
import { useItemMutations } from '../edit/itemMutations';
import { useDeleteWithUndo } from '../edit/useDeleteWithUndo';
import { pathForFolder } from '../hooks/useFolderUrlSync';
import { MoveToSheet } from '../layout/MoveToSheet';
import { formatNoteWhen, NoteEditor, NoteEditorHandle, noteTimestamp } from './NoteEditor';

/** `/n/<note id>` opens that note full screen; `/n/<folder id>?new=1` starts a new one (phone). */
export const phoneNoteTarget = (pathname: string, search: string, folderId: string): string | null => {
  const m = pathname.match(/^\/n\/(.+)$/);
  if (!m) return null;
  let id = m[1];
  try {
    id = decodeURIComponent(id);
  } catch {
    /* keep as is */
  }
  if (id === folderId) return new URLSearchParams(search).get('new') ? 'new' : null;
  return id.startsWith(`${folderId}::`) || id.includes('::NOTE::') ? id : null;
};

type Props = { folderId: string; noteId: string; folderName: string; enabled: boolean };

/**
 * Phone: one note full screen (docs/mockups/notes-phone.html 2 and 3). The header has the back label (the folder),
 * no title, and the note's `...` menu, which becomes "Done" while typing. New notes start empty with the cursor in
 * the title and are only created on the first keystroke.
 */
export const NoteScreen: React.FC<Props> = ({ folderId, noteId, folderName, enabled }) => {
  const history = useHistory();
  const byId = useSelector((state: RootState) => state.person.byId);
  const isNew = noteId === 'new';
  // A note started on this screen keeps its editor (and the cursor) when it gets its id, even before the folder's
  // cached list contains it.
  const [startedNew] = useState(isNew);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const id = isNew ? createdId : noteId;
  const item: NoteItemType | undefined = id ? byId[folderId]?.dataLable?.find((d) => d.id === id) : undefined;
  const mutations = useItemMutations(folderId);
  const deleteWithUndo = useDeleteWithUndo(mutations);
  const editor = useRef<NoteEditorHandle>(null);
  const [focused, setFocused] = useState(isNew);
  const [moving, setMoving] = useState(false);
  // The editor is created once per screen: a new note keeps its editor (and caret) when it gets its id.
  const [startItem] = useState(item);

  const back = () => {
    editor.current?.flush();
    if ((history.location.state as any)?.fromList) history.goBack();
    else history.replace(pathForFolder(folderId));
  };

  useHeader(
    {
      layout: 'note',
      back: { label: folderName || 'Back', onClick: back },
      done: focused ? () => editor.current?.blur() : null,
      menu: focused || !item
        ? undefined
        : [
            { label: 'Copy', onSelect: () => void navigator.clipboard?.writeText(item.content?.data ?? '') },
            { label: 'Move to...', onSelect: () => setMoving(true) },
            {
              label: 'Delete',
              danger: true,
              onSelect: () => {
                deleteWithUndo(item, 'Note deleted');
                history.replace(pathForFolder(folderId));
              },
            },
          ],
    },
    enabled,
  );

  if (!startedNew && !item && !startItem) {
    // Still loading the folder (deep link / refresh): show the empty page, not an error.
    if (!byId[folderId]) return <div className="note-screen" />;
    return <div className="note-missing">This note is not here (deleted or moved).</div>;
  }

  return (
    <div className="note-screen swiper-no-swiping">
      <NoteEditor
        ref={editor}
        item={item ?? startItem}
        folderId={folderId}
        mutations={mutations}
        variant="phone"
        when={formatNoteWhen(item ? noteTimestamp(item) : isNew ? Date.now() : undefined)}
        autoFocusTitle={isNew}
        onFocusChange={setFocused}
        onCreated={(newId) => {
          setCreatedId(newId);
          history.replace(`/n/${encodeURIComponent(newId)}`, history.location.state);
        }}
      />
      {moving && item && (
        <MoveToSheet
          item={item}
          notebook={folderId.split('::')[0]}
          initiallyOpen={[folderId]}
          onPick={(target) => {
            void mutations.move(item, target);
            history.replace(pathForFolder(folderId));
          }}
          onClose={() => setMoving(false)}
        />
      )}
    </div>
  );
};
