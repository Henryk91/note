import React from 'react';
import { NoteBlock, TrailingBlock } from '../../edit/NoteBlock';
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
  actions: {
    showHideBox: (prop: string) => void;
    saveShowTag: (tag: string) => void;
    continueLog: (payload: any) => void;
    updateNoteItem: (payload: any) => void;
    openFolder: (item: NoteItemType) => void;
  };
}

const NoteDetailTags: React.FC<NoteDetailTagsProps> = ({ person, isLastPage, hideFolders = false, actions }) => {
  const byId = useSelector((state: RootState) => state.person.byId);
  const persons = byId;

  const { openFolder } = actions;

  const mutations = useItemMutations(person.id);
  const deleteWithUndo = useDeleteWithUndo(mutations);

  const all = person?.dataLable ?? [];
  const folders = hideFolders ? [] : all.filter((i) => i.type === 'FOLDER');
  const notes = all.filter((i) => i.type === 'NOTE');

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
      {notes.map((n) => (
        <NoteBlock key={n.id} item={n} mutations={mutations} onDelete={deleteWithUndo} />
      ))}
      {isLastPage && <TrailingBlock key={person.id} folderId={person.id} mutations={mutations} />}
    </div>
  );
};

export default NoteDetailTags;
