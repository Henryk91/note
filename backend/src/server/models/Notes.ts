import mongoose, { Model, Schema } from 'mongoose';
import { NoteAttrs, NoteV2Attrs, NoteV2Content } from '../types/models';

const noteSchema = new Schema<NoteAttrs>({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  createdBy: { type: String, required: true },
  heading: { type: String, required: true },
  dataLable: { type: Array },
});

const noteContent = new Schema<NoteV2Content>({
  data: { type: String, required: true },
  date: { type: String },
});

const noteV2Schema = new Schema<NoteV2Attrs>(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String },
    parentId: { type: String },
    type: { type: String, required: true },
    content: { type: noteContent },
    // Optional per-log display settings (stored on the log's FOLDER document).
    settings: { type: Schema.Types.Mixed },
    // Optional soft delete marker. Missing or null means "not deleted".
    deletedAt: { type: Date, default: undefined },
  },
  // createdAt / updatedAt are added for new and updated documents only; old ones simply lack them.
  { timestamps: true },
);

export const NoteModel: Model<NoteAttrs> = mongoose.model<NoteAttrs>('Notes', noteSchema, 'notes');

export const NoteV2Model: Model<NoteV2Attrs> = mongoose.model<NoteV2Attrs>('NoteV2', noteV2Schema, 'notes-v2');
