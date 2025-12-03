

export type Note = {
  id: string;
  heading: string;
  dataLable: NoteLabel[] | NoteItemType[];
  createdBy?: string;
  userId?: string;
};

export type Match = {
  isExact: boolean;
  params: { id: string };
  path: string;
  url: string;
};

export type PageDescriptor = { params: { id: string, tempId: string } };


export type NoteItemMap = {
  [key: string]: {id: string, dataLable: NoteLabel[] | NoteItemType[], heading?: string, other?: any};
};
// export type NoteItemMap = {
//   [key: string]: {id: string, dataLable: NoteItemType[], heading?: string};
// };

export enum ItemType {
  FOLDER = "FOLDER",
  NOTE = "NOTE",
  LOG = "LOG",
}

export type NoteContent = {
  date?: string;
  data: string;
};

export type NoteItemType = {
  userId?: string;
  id: string;
  type: ItemType;
  name?: string;
  content?: NoteContent;
  parentId: string;
  data?: string;
  tag?: string;
  edit?: string;
  date?: string;
};

export type NoteLabel = {
  tag: string;
  data: string;
  edit?: string;
  date?: string;
};