import { NoteModel, NoteV2Model } from '../models/Notes';
import { NoteAttrs, NoteV2Attrs, NoteDoc, NoteV2Doc } from '../types/models';

export class NoteRepository {
  async findNotesByUserId(userId: string): Promise<NoteDoc[]> {
    return NoteModel.find({ userId }).exec();
  }

  async findNotesByUserAndCreatedBy(userId: string, createdBy: string): Promise<NoteDoc[]> {
    return NoteModel.find({ userId, createdBy }).exec();
  }

  async findNoteByIdAndUser(id: string, userId: string): Promise<NoteDoc | null> {
    return NoteModel.findOne({ id, userId }).exec();
  }

  async createNoteV1(data: NoteAttrs): Promise<NoteDoc> {
    const note = new NoteModel(data);
    return note.save();
  }

  async findNoteV2ById(userId: string, id: string): Promise<NoteV2Doc | null> {
    return NoteV2Model.findOne({ userId, id }).exec();
  }

  async findNotesV2ByParentId(userId: string, parentId: string): Promise<NoteV2Doc[]> {
    return NoteV2Model.find({ userId, parentId }).sort({ _id: 1 }).exec();
  }

  async findNotesV2ByParentIds(userId: string, parentIds: string[]): Promise<NoteV2Doc[]> {
    return NoteV2Model.find({ userId, parentId: { $in: parentIds } })
      .sort({ _id: 1 })
      .exec();
  }

  async createNoteV2(data: NoteV2Attrs): Promise<NoteV2Doc> {
    const note = new NoteV2Model(data);
    return note.save();
  }

  async updateNotesV2ParentId(userId: string, oldParentId: string, newParentId: string): Promise<void> {
    await NoteV2Model.updateMany({ userId, parentId: oldParentId }, { $set: { parentId: newParentId } }).exec();
  }

  async deleteNoteV2(userId: string, id: string): Promise<{ deletedCount?: number }> {
    return NoteV2Model.deleteOne({ userId, id }).exec();
  }

  async findNoteV2ByNameAndParent(userId: string, parentId: string, name: string): Promise<NoteV2Doc | null> {
    return NoteV2Model.findOne({ userId, parentId, name }).exec();
  }
}

export const noteRepository = new NoteRepository();
