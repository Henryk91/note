import { NoteModel, NoteV2Model } from '../models/Notes';
import {
  NoteAttrs,
  NoteV2Attrs,
  NoteItemMap,
  NewV2NoteBody,
  UpdateV2NoteBody,
  DeleteV2NoteBody,
  NotePersonUpdate,
  NoteDoc,
} from '../types/models';
import { docId, onlyUnique, mapNoteV2ToNoteV1 } from '../utils';

export class NoteService {
  async getNotes(userId: string) {
    return NoteModel.find({ userId });
  }

  async getMyNotes(userId: string, userQuery?: string) {
    const decodedUser = userQuery ? decodeURI(userQuery) : undefined;
    const notes = (await NoteModel.find({
      createdBy: decodedUser,
      userId,
    })) as NoteDoc[];

    return notes.map((doc) => ({
      createdBy: doc.createdBy,
      dataLable: doc.dataLable,
      heading: doc.heading,
      id: doc.id,
    }));
  }

  async getNote(userId: string, userQuery: string, noteHeading: string) {
    const decodedUser = decodeURI(userQuery);
    const decodedHeading = decodeURI(noteHeading);
    const notes = (await NoteModel.find({
      createdBy: decodedUser,
      userId,
      id: decodedHeading,
    })) as NoteDoc[];

    return notes.map((doc) => ({
      createdBy: doc.createdBy,
      dataLable: doc.dataLable,
      heading: doc.heading,
      id: doc.id,
    }));
  }

  async getNoteNames(userId: string) {
    const notes = (await NoteModel.find({ userId })) as NoteDoc[];
    const names = notes.map((doc) => doc.createdBy).filter((name): name is string => !!name);
    return names.filter(onlyUnique);
  }

  async createNoteV1(userId: string, data: Partial<NoteAttrs>) {
    const note = { ...data, userId };
    const newNote = new NoteModel(note);
    await newNote.save();
    return 'Created';
  }

  async updateNoteV1(userId: string, updateData: NotePersonUpdate) {
    const updateNoteId = updateData.id;
    const doc = (await NoteModel.findOne({
      id: updateNoteId,
      userId,
    })) as NoteDoc | null;

    if (!doc) throw new Error('No notes');

    doc.heading = updateData.heading || doc.heading;
    doc.dataLable = [updateData.dataLable];
    await doc.save();
    return 'success';
  }

  async patchNoteV1(userId: string, person: NotePersonUpdate, isDelete: boolean = false) {
    const updateNoteId = person?.id;
    const doc = (await NoteModel.findOne({ id: updateNoteId, userId })) as NoteDoc | null;
    if (!doc) throw new Error('Note not found');

    if (person.heading) doc.heading = person.heading;

    if (doc.dataLable) {
      if (isDelete) {
        const targetString = JSON.stringify(person.dataLable);
        doc.dataLable = doc.dataLable.filter((item) => JSON.stringify(item) !== targetString);
      } else if (person.dataLable?.edit) {
        const { dataLable } = person;
        const index = doc.dataLable.findIndex((item) => item.data === dataLable.data);
        if (index !== -1 && dataLable.edit) {
          const updatedLable = [...doc.dataLable];
          updatedLable[index] = { ...updatedLable[index], data: dataLable.edit };
          doc.dataLable = updatedLable;
        }
      } else if (person.dataLable) {
        doc.dataLable.push(person.dataLable);
      }
    }
    await doc.save();
    return 'success';
  }

  async getNoteV2Content(userId: string, parentId: string) {
    return NoteV2Model.find({
      userId,
      parentId: parentId ?? '',
    }).sort({ _id: 1 });
  }

  async getOneLevelDown(userId: string, rootParentId: string) {
    const currentNote = await NoteV2Model.findOne({ userId, id: rootParentId });
    const level1 = await NoteV2Model.find({
      userId,
      parentId: rootParentId,
    }).sort({ _id: 1 });
    const level1Ids = level1.map((n) => n.id);
    const level2 = await NoteV2Model.find({
      userId,
      parentId: { $in: level1Ids },
    }).sort({ _id: 1 });

    const map: NoteItemMap = {
      [rootParentId]: {
        id: rootParentId,
        heading: currentNote?.name || '',
        dataLable: level1,
      },
    };

    level2.forEach((child) => {
      if (!map[child.parentId]) {
        const heading = level1.find((l) => l.id === child.parentId)?.name;
        map[child.parentId] = {
          id: child.parentId,
          heading: heading || '',
          dataLable: [],
        };
      }
      map[child.parentId].dataLable.push(child);
    });
    return map;
  }

  async createNoteV2(userId: string, data: NewV2NoteBody) {
    const { id, parentId, type, content, name } = data;
    if (!id || !type) throw new Error('Missing required fields');

    const existing = await NoteV2Model.findOne({ userId, id });
    if (existing) return existing;

    if (parentId) {
      const existingParent = await NoteV2Model.findOne({ userId, id: parentId });
      if (!existingParent) {
        const folder = new NoteV2Model({
          name: parentId,
          id: parentId,
          parentId: '',
          type: 'FOLDER',
          userId,
        });
        await folder.save();
      }
    }

    const newNoteData: NoteV2Attrs = {
      id,
      parentId: parentId ?? '',
      type,
      content,
      userId,
      name,
    };

    if (type === 'LOG' && parentId) {
      newNoteData.parentId = await this.getOrCreateParentLogFolderId(userId, parentId, newNoteData);
    }

    const newNote = new NoteV2Model(newNoteData);
    const savedDoc = await newNote.save();

    try {
      await this.syncCreateV1Note(userId, data);
    } catch (err) {
      console.warn('V1 Sync Failed', err);
    }

    return savedDoc;
  }

  async updateNoteV2(userId: string, data: UpdateV2NoteBody) {
    const { id } = data;
    const doc = await NoteV2Model.findOne({ id, userId });
    if (!doc) throw new Error(`Error no note id: ${id}`);

    if (data.parentId !== undefined) doc.parentId = data.parentId;
    if (data.content !== undefined) doc.content = data.content;
    if (data.name !== undefined) doc.name = data.name;

    const savedDoc = await doc.save();

    try {
      await this.syncUpdateV1Note(userId, data);
    } catch (err) {
      console.warn('V1 Sync Failed', err);
    }
    return savedDoc;
  }

  async deleteNoteV2(userId: string, data: DeleteV2NoteBody) {
    const { id, type } = data;

    if (type === 'FOLDER') {
      const folderToEmpty = await NoteV2Model.findOne({ id, userId });
      if (folderToEmpty) {
        await NoteV2Model.updateMany(
          { parentId: folderToEmpty.id, userId },
          { $set: { parentId: folderToEmpty.parentId } },
        );
      }
    }

    const noteToDelete = await NoteV2Model.findOne({ id, userId });
    const result = await NoteV2Model.deleteOne({ id, userId });

    if (noteToDelete) {
      try {
        await this.syncDeleteV1NoteWithDoc(userId, noteToDelete);
      } catch (err) {
        console.warn('V1 Sync Failed', err);
      }
    }

    return result;
  }

  private async getOrCreateParentLogFolderId(userId: string, parentId: string, note: NoteV2Attrs): Promise<string> {
    const parentData = await NoteV2Model.findOne({ userId, id: parentId });
    if (parentData?.name === 'Log') return note.parentId;

    const logParent = await NoteV2Model.findOne({ userId, parentId, name: 'Log' });
    if (logParent) return logParent.id;

    const newLogParent = new NoteV2Model({
      id: `${parentId}::Log`,
      parentId,
      type: 'FOLDER',
      name: 'Log',
      userId,
    });
    await newLogParent.save();
    return newLogParent.id;
  }

  private async syncCreateV1Note(userId: string, data: NewV2NoteBody) {
    const fullData: NoteV2Attrs = { ...data, userId };
    if (data.type === 'FOLDER') {
      const syncBody = { ...fullData };
      syncBody.content = { data: `href:${data.id}`, tag: `Sub: ${data.name}` };
      const mapped = mapNoteV2ToNoteV1(syncBody);
      if (mapped.id) {
        await this.createNoteV1(userId, {
          id: mapped.id,
          createdBy: mapped.createdBy || '',
          heading: mapped.heading || '',
          dataLable: mapped.dataLable || [],
        });
      }
    } else {
      const mapped = mapNoteV2ToNoteV1(fullData);
      if (mapped.person) {
        await this.patchNoteV1(userId, mapped.person);
      }
    }
  }

  private async syncUpdateV1Note(userId: string, data: UpdateV2NoteBody) {
    const freshDoc = await NoteV2Model.findOne({ id: data.id, userId });
    if (!freshDoc) return;
    const mappedFresh = mapNoteV2ToNoteV1(freshDoc.toObject());
    if (mappedFresh.person) {
      await this.patchNoteV1(userId, mappedFresh.person);
    }
  }

  private async syncDeleteV1NoteWithDoc(userId: string, doc: any) {
    const mapped = mapNoteV2ToNoteV1(doc.toObject ? doc.toObject() : doc);
    if (mapped.person) {
      await this.patchNoteV1(userId, mapped.person, true);
    }
  }
}

export const noteService = new NoteService();
