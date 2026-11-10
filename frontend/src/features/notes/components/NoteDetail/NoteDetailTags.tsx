import React, { useState } from 'react';
import NoteItem from '../NoteItem/NoteItem';
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

  const { showHideBox, saveShowTag, updateNoteItem, openFolder } = actions;

  // State to track which item is being edited (to hide others)
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className={'detailedBox'}>
      {person?.dataLable?.map((noteItem, i) => {
        const isLink = noteItem.type === 'FOLDER';
        const isNote = noteItem.type === 'NOTE';
        const isLogDirectory = noteItem.name === 'Log';
        const prop = (noteItem as any).heading ?? noteItem.name ?? noteItem?.content?.data ?? 'Unknown';
        const contentCount = persons?.[noteItem.id]?.dataLable?.length;

        // Determine if this item should be hidden (when another item is being edited)
        const isHidden = editingId !== null && editingId !== noteItem.id;

        return (
          <div
            className={`detailedBox ${isHidden ? 'hidden-noteItemBox' : ''}`}
            key={(noteItem.id || prop) + i}
            style={isHidden ? { display: 'none' } : {}}
          >
            {isLink && isLogDirectory && (
              <LogListRow logItem={noteItem} items={persons?.[noteItem.id]?.dataLable} onOpen={() => openFolder(noteItem)} />
            )}
            {isLink && !isLogDirectory && (
              <FolderList
                linkBorder={'link-border'}
                prop={prop}
                contentCount={contentCount}
                onShowHide={() => showHideBox(prop)}
                onShowLogDays={() => undefined}
                onShowLogTag={(tag) => saveShowTag(tag)}
                onChangeDate={() => undefined}
              />
            )}
            {isNote && (
              <NoteItem
                item={noteItem}
                show={isLastPage}
                set={updateNoteItem}
                type={prop}
                index={i}
                onEditStart={() => setEditingId(noteItem.id)}
                onEditEnd={() => setEditingId(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NoteDetailTags;
