import type mongoose from 'mongoose';
import type { Request as ExpressRequest } from 'express';

export type AuthInfo = { sub: string; userId: string };

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthInfo;
  }
}

export type Callback<T = unknown> = (resp: T) => void;

export type AuthenticatedRequest<
  TBody = unknown,
  TQuery = Record<string, string | undefined>,
> = ExpressRequest<Record<string, string>, unknown, TBody, TQuery> & {
  auth: AuthInfo;
};

export type QueryRequest<TQuery> = ExpressRequest<
  Record<string, string>,
  unknown,
  unknown,
  TQuery
>;

export interface NoteDataLabel {
  tag?: string;
  data: string;
  edit?: string;
  name?: string;
  [key: string]: unknown;
}

export interface NoteAttrs {
  id: string;
  userId: string;
  createdBy: string;
  heading: string;
  dataLable?: NoteDataLabel[];
}

export type NoteDoc = mongoose.HydratedDocument<NoteAttrs>;

export interface NoteV2Content {
  data: string;
  date?: string;
  tag?: string;
}

export interface NoteV2Attrs {
  id: string;
  userId: string;
  parentId: string;
  type: string;
  name?: string;
  content?: NoteV2Content;
}

export type NoteItemMap = {
  [key: string]: { heading?: string; id: string; dataLable: NoteV2Attrs[] };
};

export type NoteV2Doc = mongoose.HydratedDocument<NoteV2Attrs>;

export interface NoteUserAttrs {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  tempPass: string[];
  permId: string;
}

export type NoteUserDoc = mongoose.HydratedDocument<NoteUserAttrs>;

export type NewNotePayload = NoteAttrs & Record<string, unknown>;
export type UserLoginPayload = { email: string; password: string };

export interface NotePersonUpdate {
  id: string;
  heading?: string;
  dataLable: NoteDataLabel;
}

export interface UpdateNoteBody {
  person: NotePersonUpdate;
}

export interface UpdateOneNoteBody {
  person: NotePersonUpdate;
  delete?: boolean;
}

export type NoteQuery = { user: string; noteHeading?: string };
export type UserQuery = { user: string };
export type SiteLogQuery = { site?: string };
export type SavedTranslationQuery = { level?: string; subLevel?: string };
export type V2ParentQuery = { parentId?: string };

export interface NewV2NoteBody {
  id: string;
  parentId: string;
  type: string;
  content?: NoteV2Content;
  name?: string;
}

export interface UpdateV2NoteBody {
  id: string;
  parentId?: string;
  content?: NoteV2Content;
  name?: string;
}

export interface DeleteV2NoteBody {
  id: string;
  type?: string;
}

export interface TranslationScoreAttrs {
  userId: string;
  exerciseId: string;
  score: number;
  attempts?: number;
}

export type TranslationScoreDoc =
  mongoose.HydratedDocument<TranslationScoreAttrs>;

export interface IncorrectTranslationAttrs {
  userId: string;
  exerciseId: string;
  sentence: string;
  userInput: string;
  translation: string;
  corrected?: boolean;
  attempts?: number;
}

export type IncorrectTranslationDoc =
  mongoose.HydratedDocument<IncorrectTranslationAttrs>;
