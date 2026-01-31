import { NoteRepository, noteRepository } from '../repositories/NoteRepository';
import {
  NoteAttrs,
  NoteV2Attrs,
  NoteItemMap,
  NewV2NoteBody,
  UpdateV2NoteBody,
  DeleteV2NoteBody,
  NotePersonUpdate,
} from '../types/models';
import { onlyUnique, mapNoteV2ToNoteV1 } from '../utils';
import logger from '../utils/logger';

export class NoteService {
  private repo: NoteRepository;

  constructor(repo: NoteRepository = noteRepository) {
    this.repo = repo;
  }

  async getNotes(userId: string) {
    return this.repo.findNotesByUserId(userId);
  }

  async getMyNotes(userId: string, userQuery?: string) {
    const decodedUser = userQuery ? decodeURI(userQuery) : undefined;
    const notes = await this.repo.findNotesByUserAndCreatedBy(userId, decodedUser);

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
    const doc = await this.repo.findNoteByIdAndUser(decodedHeading, userId);

    if (!doc || doc.createdBy !== decodedUser) return [];

    return [
      {
        createdBy: doc.createdBy,
        dataLable: doc.dataLable,
        heading: doc.heading,
        id: doc.id,
      },
    ];
  }

  async getNoteNames(userId: string) {
    const notes = await this.repo.findNotesByUserId(userId);
    const names = notes.map((doc) => doc.createdBy).filter((name): name is string => !!name);
    return names.filter(onlyUnique);
  }

  async createNoteV1(userId: string, data: Partial<NoteAttrs>) {
    const note = { ...data, userId } as NoteAttrs;
    await this.repo.createNoteV1(note);
    return 'Created';
  }

  async updateNoteV1(userId: string, updateData: NotePersonUpdate) {
    const updateNoteId = updateData.id;
    const doc = await this.repo.findNoteByIdAndUser(updateNoteId, userId);

    if (!doc) throw new Error('No notes');

    const updates: Partial<NoteAttrs> = {
      heading: updateData.heading || doc.heading,
      dataLable: [updateData.dataLable],
    };

    await this.repo.updateNoteV1(updateNoteId, userId, updates);
    return 'success';
  }

  async patchNoteV1(userId: string, person: NotePersonUpdate, isDelete = false) {
    const updateNoteId = person?.id;
    const doc = await this.repo.findNoteByIdAndUser(updateNoteId, userId);
    if (!doc) throw new Error('Note not found');

    const updates: Partial<NoteAttrs> = {};
    if (person.heading) updates.heading = person.heading;

    if (doc.dataLable) {
      let newDataLable = [...doc.dataLable];
      if (isDelete) {
        const targetString = JSON.stringify(person.dataLable);
        newDataLable = newDataLable.filter((item) => JSON.stringify(item) !== targetString);
      } else if (person.dataLable?.edit) {
        const { dataLable } = person;
        const index = newDataLable.findIndex((item) => item.data === dataLable.data);
        if (index !== -1 && dataLable.edit) {
          newDataLable[index] = { ...newDataLable[index], data: dataLable.edit };
        }
      } else if (person.dataLable) {
        newDataLable.push(person.dataLable);
      }
      updates.dataLable = newDataLable;
    }

    await this.repo.updateNoteV1(updateNoteId, userId, updates);
    return 'success';
  }

  async getNoteV2Content(userId: string, parentId: string) {
    return this.repo.findNotesV2ByParentId(userId, parentId ?? '');
  }

  async getOneLevelDown(userId: string, rootParentId: string) {
    const [currentNote, level1] = await Promise.all([
      this.repo.findNoteV2ById(userId, rootParentId),
      this.repo.findNotesV2ByParentId(userId, rootParentId),
    ]);

    const level1Ids = level1.map((n) => n.id);
    const level2 = await this.repo.findNotesV2ByParentIds(userId, level1Ids);

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

    const existing = await this.repo.findNoteV2ById(userId, id);
    if (existing) return existing;

    if (parentId) {
      const existingParent = await this.repo.findNoteV2ById(userId, parentId);
      if (!existingParent) {
        await this.repo.createNoteV2({
          name: parentId,
          id: parentId,
          parentId: '',
          type: 'FOLDER',
          userId,
        });
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
      logger.warn(
        { noteId: id, parentId: (existing as any)?.parentId },
        'Inconsistent state: Note has different parentId than requested for deletion',
      );
      newNoteData.parentId = await this.getOrCreateParentLogFolderId(userId, parentId, newNoteData);
    }

    const savedDoc = await this.repo.createNoteV2(newNoteData);

    try {
      await this.syncCreateV1Note(userId, data);
    } catch (err) {
      logger.warn({ err }, 'V1 Sync Failed');
    }

    return savedDoc;
  }

  async updateNoteV2(userId: string, data: UpdateV2NoteBody) {
    const { id } = data;
    const doc = await this.repo.findNoteV2ById(userId, id);
    if (!doc) throw new Error(`Error no note id: ${id}`);

    const updates: Partial<NoteV2Attrs> = {};
    if (data.parentId !== undefined) updates.parentId = data.parentId;
    if (data.content !== undefined) updates.content = data.content;
    if (data.name !== undefined) updates.name = data.name;

    const savedDoc = await this.repo.updateNoteV2(id, userId, updates);

    try {
      await this.syncUpdateV1Note(userId, data);
    } catch (err) {
      logger.warn({ err }, 'V1 Sync Failed');
    }
    return savedDoc!;
  }

  async deleteNoteV2(userId: string, data: DeleteV2NoteBody) {
    const { id, type } = data;

    if (type === 'FOLDER') {
      const folderToEmpty = await this.repo.findNoteV2ById(userId, id);
      if (folderToEmpty) {
        await this.repo.updateNotesV2ParentId(userId, folderToEmpty.id, folderToEmpty.parentId);
      }
    }

    const noteToDelete = await this.repo.findNoteV2ById(userId, id);
    const result = await this.repo.deleteNoteV2(userId, id);

    if (noteToDelete) {
      try {
        await this.syncDeleteV1NoteWithDoc(userId, noteToDelete);
      } catch (err) {
        logger.warn({ err }, 'V1 Sync Failed');
      }
    }

    return result;
  }

  private async getOrCreateParentLogFolderId(userId: string, parentId: string, note: NoteV2Attrs): Promise<string> {
    const parentData = await this.repo.findNoteV2ById(userId, parentId);
    if (parentData?.name === 'Log') return note.parentId;

    const logParent = await this.repo.findNoteV2ByNameAndParent(userId, parentId, 'Log');
    if (logParent) return logParent.id;

    const newLogParent = await this.repo.createNoteV2({
      id: `${parentId}::Log`,
      parentId,
      type: 'FOLDER',
      name: 'Log',
      userId,
    });
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
          userId,
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
    const freshDoc = await this.repo.findNoteV2ById(userId, data.id);
    if (!freshDoc) return;
    const mappedFresh = mapNoteV2ToNoteV1(freshDoc);
    if (mappedFresh.person) {
      await this.patchNoteV1(userId, mappedFresh.person);
    }
  }

  private async syncDeleteV1NoteWithDoc(userId: string, doc: NoteV2Attrs) {
    const mapped = mapNoteV2ToNoteV1(doc);
    if (mapped.person) {
      await this.patchNoteV1(userId, mapped.person, true);
    }
  }
}

export const noteService = new NoteService();
