export type Note = {
  id: string;
  heading: string;
  dataLable: NoteItemType[];
  createdBy?: string;
  userId?: string;
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
  heading?: string;
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

type NewNoteItemType = "FOLDER" | "NOTE" | "LOG";

interface BaseDataLabel {
  _id: string;
  userId: string;
  id: string;
  parentId: string;
  type: NewNoteItemType;
  __v?: number;
}

interface FolderDataLabel extends BaseDataLabel {
  type: "FOLDER";
  name: string;
}

interface NoteDataLabel extends BaseDataLabel {
  type: "NOTE";
  content: { data: string };
}

interface LogDataLabel extends BaseDataLabel {
  type: "LOG";
  content: { data: string; date: string; _id: string };
}

export type DataLabelItem = FolderDataLabel | NoteDataLabel | LogDataLabel;

interface NodeEntry {
  id: string;
  heading: string;
  dataLable: DataLabelItem[];
}

type NodeMap = Record<string, NodeEntry>;
export type NodeRoot = NodeEntry | NodeMap;
