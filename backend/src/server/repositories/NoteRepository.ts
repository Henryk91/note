import { NoteModel, NoteV2Model } from '../models/Notes';
import { NoteAttrs, NoteV2Attrs } from '../types/models';

export class NoteRepository {
  async findNotesByUserId(userId: string): Promise<NoteAttrs[]> {
    return NoteModel.find({ userId }).lean<NoteAttrs[]>().exec();
  }

  async findNotesByUserAndCreatedBy(userId: string, createdBy: string | undefined): Promise<NoteAttrs[]> {
    const filter = createdBy ? { userId, createdBy } : { userId };
    return NoteModel.find(filter).lean<NoteAttrs[]>().exec();
  }

  async findNoteByIdAndUser(id: string, userId: string): Promise<NoteAttrs | null> {
    return NoteModel.findOne({ id, userId }).lean<NoteAttrs>().exec();
  }

  async createNoteV1(data: NoteAttrs): Promise<NoteAttrs> {
    const note = await NoteModel.create(data);
    return note.toObject();
  }

  async updateNoteV1(id: string, userId: string, updates: Partial<NoteAttrs>): Promise<NoteAttrs | null> {
    return NoteModel.findOneAndUpdate({ id, userId }, { $set: updates }, { new: true }).lean<NoteAttrs>().exec();
  }

  // Soft-deleted documents have `deletedAt` set; `deletedAt: null` also matches documents that lack the field.
  async findNoteV2ById(
    userId: string,
    id: string,
    options: { includeDeleted?: boolean } = {},
  ): Promise<NoteV2Attrs | null> {
    const filter = options.includeDeleted ? { userId, id } : { userId, id, deletedAt: null };
    return NoteV2Model.findOne(filter).lean<NoteV2Attrs>().exec();
  }

  async findNotesV2ByParentId(userId: string, parentId: string): Promise<NoteV2Attrs[]> {
    return NoteV2Model.find({ userId, parentId, deletedAt: null }).sort({ _id: 1 }).lean<NoteV2Attrs[]>().exec();
  }

  async findNotesV2ByParentIds(userId: string, parentIds: string[]): Promise<NoteV2Attrs[]> {
    return NoteV2Model.find({ userId, parentId: { $in: parentIds }, deletedAt: null })
      .sort({ _id: 1 })
      .lean<NoteV2Attrs[]>()
      .exec();
  }

  /** Children of the given parents, deleted or not (used to walk a subtree). */
  async findAllChildrenV2(userId: string, parentIds: string[]): Promise<NoteV2Attrs[]> {
    return NoteV2Model.find({ userId, parentId: { $in: parentIds } })
      .lean<NoteV2Attrs[]>()
      .exec();
  }

  async findDeletedNotesV2(userId: string): Promise<NoteV2Attrs[]> {
    return NoteV2Model.find({ userId, deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .lean<NoteV2Attrs[]>()
      .exec();
  }

  async findPinnedLogsV2(userId: string): Promise<NoteV2Attrs[]> {
    return NoteV2Model.find({ userId, type: 'FOLDER', 'settings.pinned': true, deletedAt: null })
      .sort({ _id: 1 })
      .lean<NoteV2Attrs[]>()
      .exec();
  }

  async createNoteV2(data: NoteV2Attrs): Promise<NoteV2Attrs> {
    const note = await NoteV2Model.create(data);
    return note.toObject();
  }

  async updateNoteV2(id: string, userId: string, updates: Partial<NoteV2Attrs>): Promise<NoteV2Attrs | null> {
    return NoteV2Model.findOneAndUpdate({ id, userId }, { $set: updates }, { new: true }).lean<NoteV2Attrs>().exec();
  }

  /** Clears `deletedAt` (and keeps other fields). */
  async restoreNotesV2(userId: string, ids: string[]): Promise<void> {
    await NoteV2Model.updateMany({ userId, id: { $in: ids } }, { $unset: { deletedAt: 1 } }).exec();
  }

  async softDeleteNotesV2(userId: string, ids: string[], deletedAt: Date): Promise<void> {
    await NoteV2Model.updateMany({ userId, id: { $in: ids }, deletedAt: null }, { $set: { deletedAt } }).exec();
  }

  async hardDeleteNotesV2(userId: string, ids: string[]): Promise<{ deletedCount?: number }> {
    return NoteV2Model.deleteMany({ userId, id: { $in: ids } }).exec();
  }

  async updateNotesV2ParentId(userId: string, oldParentId: string, newParentId: string): Promise<void> {
    await NoteV2Model.updateMany({ userId, parentId: oldParentId }, { $set: { parentId: newParentId } }).exec();
  }

  async findNoteV2ByNameAndParent(userId: string, parentId: string, name: string): Promise<NoteV2Attrs | null> {
    return NoteV2Model.findOne({ userId, parentId, name, deletedAt: null }).lean<NoteV2Attrs>().exec();
  }

  async getTranslationLevelsAggregate(
    userId: string,
    parentId: string,
  ): Promise<Array<{ name?: string; children: Array<{ name?: string }> }>> {
    return NoteV2Model.aggregate([
      {
        $match: {
          userId,
          parentId,
          deletedAt: null,
        },
      },
      {
        $lookup: {
          from: 'notes-v2',
          localField: 'id',
          foreignField: 'parentId',
          pipeline: [{ $match: { deletedAt: null } }],
          as: 'children',
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          name: 1,
          'children.name': 1,
        },
      },
    ]);
  }

  async findTranslationPracticeNotes(createdBy: string): Promise<NoteAttrs[]> {
    return NoteModel.find({ createdBy }).lean<NoteAttrs[]>().exec();
  }
}

export const noteRepository = new NoteRepository();
