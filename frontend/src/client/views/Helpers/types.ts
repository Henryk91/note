export type NoteLabel = {
  tag: string;
  data: string;
  edit?: string;
  date?: string;
};

export type Note = {
  id: string;
  heading: string;
  dataLable: NoteLabel[];
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