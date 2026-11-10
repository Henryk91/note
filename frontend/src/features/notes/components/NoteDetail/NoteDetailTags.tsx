import React from 'react';
import { NoteBlock, TrailingBlock } from '../../edit/NoteBlock';
import { SwipeRow } from '../../edit/SwipeRow';
import { useItemMutations } from '../../edit/itemMutations';
import { useDeleteWithUndo } from '../../edit/useDeleteWithUndo';
import { FolderList } from './forms';
import { Note, NoteItemType } from '../../../../shared/utils/Helpers/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { LogListRow } from '../../log/LogListRow';

interface NoteDetailTagsProps {
  person: Note;
  isLastPage: boolean;
  actions: {
    showHideBox: (prop: string) => void;
    saveShowTag: (tag: string) => void;
    continueLog: (payload: any) => void;
    updateNoteItem: (payload: any) => void;
    openFolder: (item: NoteItemType) => void;
  };
}

const NoteDetailTags: React.FC<NoteDetailTagsProps> = ({ person, isLastPage, actions }) => {
  const byId = useSelector((state: RootState) => state.person.byId);
  const persons = byId;

  const { showHideBox, saveShowTag, openFolder } = actions;

  const mutations = useItemMutations(person.id);
  const deleteWithUndo = useDeleteWithUndo(mutations);

  return (
    <div className={'detailedBox'}>
      {person?.dataLable?.map((noteItem, i) => {
        const isLink = noteItem.type === 'FOLDER';
        const isNote = noteItem.type === 'NOTE';
        const isLogDirectory = noteItem.name === 'Log';
        const prop = (noteItem as any).heading ?? noteItem.name ?? noteItem?.content?.data ?? 'Unknown';
        const contentCount = persons?.[noteItem.id]?.dataLable?.length;

        return (
          <div className="detailedBox" key={(noteItem.id || prop) + i}>
            {isLink && isLogDirectory && (
              <SwipeRow onDelete={() => deleteWithUndo(noteItem, 'Log deleted')}>
                <LogListRow logItem={noteItem} items={persons?.[noteItem.id]?.dataLable} onOpen={() => openFolder(noteItem)} />
              </SwipeRow>
            )}
            {isLink && !isLogDirectory && (
              <SwipeRow onDelete={() => deleteWithUndo(noteItem, 'Folder deleted')}>
                <FolderList
                  linkBorder={'link-border'}
                  prop={prop}
                  contentCount={contentCount}
                  onShowHide={() => showHideBox(prop)}
                  onShowLogDays={() => undefined}
                  onShowLogTag={(tag) => saveShowTag(tag)}
                  onChangeDate={() => undefined}
                />
              </SwipeRow>
            )}
            {isNote && <NoteBlock item={noteItem} mutations={mutations} onDelete={deleteWithUndo} />}
          </div>
        );
      })}
      {isLastPage && <TrailingBlock key={person.id} folderId={person.id} mutations={mutations} />}
    </div>
  );
};

export default NoteDetailTags;
