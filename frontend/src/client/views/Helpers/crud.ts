import { createNoteV2, updateNoteV2, deleteNoteV2 } from './requests';
import { NoteContent, ItemType, NoteItemType } from './types';
import { generateDocId } from './utils';

export const addItem = (_content: NoteContent, _parentId: string, done: (data) => void) => {
  if (_content.data === '') return;
  const noteType = _content.date ? ItemType.LOG : ItemType.NOTE;
  let newItem: NoteItemType = {
    id: _parentId + "::" + noteType + "::" + generateDocId(10),
    content: _content,
    parentId: _parentId,
    type: noteType,
  };

  createNoteV2(newItem, (data) => {
    done(data);
  });
};

export const addFolder = (_name: string, _parentId: string, done: (data) => void) => {
  if (_name === '') return;

  let newItem: NoteItemType = {
    id: _parentId + "::" + ItemType.FOLDER + "::" + generateDocId(10),
    name: _name.trim(),
    parentId: _parentId,
    type: ItemType.FOLDER,
  };

  createNoteV2(newItem, (data) => {
    done(data);
  });
};

export const updateItem = (_item: NoteItemType, done: (data) => void) => {
  if (_item?.id) {
    updateNoteV2(_item, (data: any) => {
      done(data);
    });
  }
};

export const deleteItem = (_item: NoteItemType, done: (data) => void) => {
  deleteNoteV2(_item, (data) => {
    done(data)
  });
};
