import React from 'react';
import { useHistory } from 'react-router-dom';
import { noteTitle, notePreview } from '../../edit/NoteBlock';
import { formatListDate, noteTimestamp, sortNotesNewestFirst } from '../../editor/NoteEditor';
import { SwipeRow } from '../../edit/SwipeRow';
import { useItemMutations } from '../../edit/itemMutations';
import { useDeleteWithUndo } from '../../edit/useDeleteWithUndo';
import { Note, NoteItemType } from '../../../../shared/utils/Helpers/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { FolderRow } from '../../layout/FolderRow';

interface NoteDetailTagsProps {
  person: Note;
  isLastPage: boolean;
  /** Wide layouts show folders and logs in the list pane, so the editor only shows the note's own blocks. */
  hideFolders?: boolean;
  /** The notebook home (first page). */
  isRoot?: boolean;
  actions: {
    showHideBox: (prop: string) => void;
    saveShowTag: (tag: string) => void;
    continueLog: (payload: any) => void;
    updateNoteItem: (payload: any) => void;
    openFolder: (item: NoteItemType) => void;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NoteDetailTags: React.FC<NoteDetailTagsProps> = ({ person, isLastPage, hideFolders = false, isRoot = false, actions }) => {
  const byId = useSelector((state: RootState) => state.person.byId);
  const persons = byId;

  const { openFolder } = actions;

  const mutations = useItemMutations(person.id);
  const deleteWithUndo = useDeleteWithUndo(mutations);

  const all = person?.dataLable ?? [];
  const folders = hideFolders ? [] : all.filter((i) => i.type === 'FOLDER');
  const notes = sortNotesNewestFirst(all.filter((i) => i.type === 'NOTE'));
  const history = useHistory();
  const openNote = (n: NoteItemType) => history.push(`/n/${encodeURIComponent(n.id)}`, { fromList: true });

  return (
    <div className="phone-body">
      {folders.length > 0 && (
        <>
          <div className="cap">Folders</div>
          <div className="card-list" data-testid="folder-list">
            {folders.map((f) => {
              const isLog = f.name === 'Log';
              return (
                <SwipeRow key={f.id} onDelete={() => deleteWithUndo(f, isLog ? 'Log deleted' : 'Folder deleted')}>
                  <FolderRow
                    name={isLog ? 'Log' : ((f as any).heading ?? f.name ?? 'Unknown')}
                    isLog={isLog}
                    count={persons?.[f.id]?.dataLable?.length}
                    onOpen={() => openFolder(f)}
                  />
                </SwipeRow>
              );
            })}
          </div>
        </>
      )}
      {notes.length > 0 && <div className="cap">Notes</div>}
      {notes.length > 0 && (
        <div className="card-list note-list" data-testid="note-list">
          {notes.map((n) => {
            const text = n.content?.data ?? '';
            const when = formatListDate(noteTimestamp(n));
            return (
              <SwipeRow key={n.id} onDelete={() => deleteWithUndo(n, 'Note deleted')}>
                <button type="button" className="note-row" onClick={() => openNote(n)}>
                  <div className="note-row-title">{noteTitle(text) || 'New note'}</div>
                  <div className="note-row-meta">
                    {when && <b>{when}</b>}
                    {notePreview(text)}
                  </div>
                </button>
              </SwipeRow>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NoteDetailTags;
