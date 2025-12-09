export type Note = {
  id: string;
  heading: string;
  dataLable: NoteItemType[];
  createdBy?: string;
  userId?: string;
};

export type Match = {
  isExact: boolean;
  params: { id: string };
  path: string;
  url: string;
};

export type PageDescriptor = { params: { id: string; tempId: string } };

export type NoteItemMap = {
  [key: string]: Note;
};

export enum ItemType {
  FOLDER = 'FOLDER',
  NOTE = 'NOTE',
  LOG = 'LOG',
}

export type NoteContent = {
  date?: string;
  data: string;
};

export type NoteItemTypeA = {
  userId?: string;
  id: string;
  type: ItemType;
  name?: string;
  content?: NoteContent;
  parentId: string;
  edit?: string;
};

export type NoteItemType = {
  userId?: string;
  id: string;
  type: ItemType;
  name?: string;
  content?: NoteContent;
  parentId: string;
};

export type NoteLabel = {
  tag: string;
  data: string;
  edit?: string;
  date?: string;
};

export type KeyValue<T = any> = {
  [key: string]: T;
};
