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
