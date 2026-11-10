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

    const existing = await this.repo.findNoteV2ById(userId, id, { includeDeleted: true });
    if (existing && existing.deletedAt) {
      // Creating an id that was soft-deleted restores it (this is how "Undo" of a delete works).
      return this.restoreNoteV2(userId, existing, {
        ...(content !== undefined ? { content } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(data.settings !== undefined ? { settings: data.settings } : {}),
        ...(parentId ? { parentId } : {}),
      });
    }
    if (existing) return existing;

    if (parentId) {
      const existingParent = await this.repo.findNoteV2ById(userId, parentId, { includeDeleted: true });
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
    if (data.settings !== undefined) newNoteData.settings = data.settings;

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
    const doc = await this.repo.findNoteV2ById(userId, id, { includeDeleted: true });
    if (!doc) throw new Error(`Error no note id: ${id}`);

    const updates: Partial<NoteV2Attrs> = {};
    if (data.parentId !== undefined) updates.parentId = data.parentId;
    if (data.content !== undefined) updates.content = data.content;
    if (data.name !== undefined) updates.name = data.name;
    if (data.settings !== undefined) updates.settings = data.settings;

    if (data.deletedAt === null && doc.deletedAt) {
      return this.restoreNoteV2(userId, doc, updates);
    }

    const savedDoc = await this.repo.updateNoteV2(id, userId, updates);

    try {
      await this.syncUpdateV1Note(userId, data);
    } catch (err) {
      logger.warn({ err }, 'V1 Sync Failed');
    }
    return savedDoc!;
  }

  /** Ids of `rootId` and every descendant, deleted or not. */
  private async collectSubtreeIds(userId: string, rootId: string): Promise<string[]> {
    const seen = new Set<string>([rootId]);
    let frontier = [rootId];
    while (frontier.length) {
      const batch = frontier;
      // eslint-disable-next-line no-await-in-loop
      const children = await this.repo.findAllChildrenV2(userId, batch);
      const fresh = children.filter((child) => !seen.has(child.id));
      fresh.forEach((child) => seen.add(child.id));
      frontier = fresh.map((child) => child.id);
    }
    return [...seen];
  }

  /** Clears deletedAt on the doc and on every descendant that was deleted together with it. */
  private async restoreNoteV2(userId: string, doc: NoteV2Attrs, updates: Partial<NoteV2Attrs>) {
    const deletedAt = doc.deletedAt ? new Date(doc.deletedAt).getTime() : undefined;
    const subtreeIds = await this.collectSubtreeIds(userId, doc.id);
    const subtree = await Promise.all(
      subtreeIds.map((sid) => this.repo.findNoteV2ById(userId, sid, { includeDeleted: true })),
    );
    const toRestore = subtree
      .filter((d): d is NoteV2Attrs => !!d && !!d.deletedAt && new Date(d.deletedAt).getTime() === deletedAt)
      .map((d) => d.id);
    await this.repo.restoreNotesV2(userId, toRestore);
    if (Object.keys(updates).length) await this.repo.updateNoteV2(doc.id, userId, updates);
    return (await this.repo.findNoteV2ById(userId, doc.id))!;
  }

  async deleteNoteV2(userId: string, data: DeleteV2NoteBody) {
    const { id, permanent } = data;

    const noteToDelete = await this.repo.findNoteV2ById(userId, id, { includeDeleted: !!permanent });
    if (!noteToDelete) return { ok: true, deletedCount: 0 };

    const subtreeIds = await this.collectSubtreeIds(userId, id);

    if (permanent) {
      const subtree = await Promise.all(
        subtreeIds.map((sid) => this.repo.findNoteV2ById(userId, sid, { includeDeleted: true })),
      );
      const result = await this.repo.hardDeleteNotesV2(userId, subtreeIds);
      await Promise.all(
        subtree
          .filter((d): d is NoteV2Attrs => !!d && !d.deletedAt)
          .map((d) => this.syncDeleteV1NoteWithDoc(userId, d).catch((err) => logger.warn({ err }, 'V1 Sync Failed'))),
      );
      return { ok: true, deletedCount: result.deletedCount ?? 0 };
    }

    // Soft delete: the item and all of its descendants get the same timestamp so a restore brings them all back.
    // (The legacy V1 mirror is left alone so that a restore does not need to re-sync it.)
    const deletedAt = new Date();
    await this.repo.softDeleteNotesV2(userId, subtreeIds, deletedAt);
    return { ok: true, deletedCount: subtreeIds.length, deletedAt };
  }

  /** Pinned logs with a label made from the parent path ("Koorvi / Track"), for the quick-log sheet. */
  async getPinnedLogs(userId: string) {
    const pinned = await this.repo.findPinnedLogsV2(userId);
    const cache = new Map<string, NoteV2Attrs | null>();
    return Promise.all(
      pinned.map(async (doc) => {
        const notebook = await this.getNotebookId(userId, doc, cache);
        const parent = doc.parentId ? await this.repo.findNoteV2ById(userId, doc.parentId) : null;
        const parentName = parent?.name || doc.parentId;
        const label = doc.parentId === notebook || !parent ? notebook : `${notebook} / ${parentName}`;
        return { id: doc.id, parentId: doc.parentId, name: doc.name, settings: doc.settings, label, notebook };
      }),
    );
  }

  private async getNotebookId(userId: string, doc: NoteV2Attrs, cache: Map<string, NoteV2Attrs | null>) {
    let current: NoteV2Attrs | null = doc;
    const guard = new Set<string>();
    while (current && current.parentId && !guard.has(current.id)) {
      guard.add(current.id);
      const { parentId }: { parentId: string } = current;
      if (!cache.has(parentId)) {
        // eslint-disable-next-line no-await-in-loop
        cache.set(parentId, await this.repo.findNoteV2ById(userId, parentId, { includeDeleted: true }));
      }
      const parent: NoteV2Attrs | null = cache.get(parentId) ?? null;
      if (!parent) return parentId;
      current = parent;
    }
    return current?.id ?? doc.id;
  }

  /** Items in "Recently Deleted": only the top-most item of each deletion (descendants come back with it). */
  async getDeleted(userId: string, notebook?: string) {
    const deleted = await this.repo.findDeletedNotesV2(userId);
    const byId = new Map(deleted.map((d) => [d.id, d]));
    const roots = deleted.filter((d) => {
      const parent = byId.get(d.parentId);
      return !(parent && new Date(parent.deletedAt!).getTime() === new Date(d.deletedAt!).getTime());
    });
    if (!notebook) return roots;
    const cache = new Map<string, NoteV2Attrs | null>();
    const result: NoteV2Attrs[] = [];
    await Promise.all(
      roots.map(async (d) => {
        if ((await this.getNotebookId(userId, d, cache)) === notebook) result.push(d);
      }),
    );
    return roots.filter((d) => result.includes(d));
  }

  /** Permanently removes soft-deleted items ("Empty Recently Deleted", or items older than N days). */
  async emptyDeleted(userId: string, notebook?: string, olderThanDays?: number) {
    let roots = await this.getDeleted(userId, notebook);
    if (olderThanDays !== undefined) {
      const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
      roots = roots.filter((d) => new Date(d.deletedAt!).getTime() <= cutoff);
    }
    const deletedCount = await roots.reduce(async (accPromise, root) => {
      const acc = await accPromise;
      const ids = await this.collectSubtreeIds(userId, root.id);
      const res = await this.repo.hardDeleteNotesV2(userId, ids);
      return acc + (res.deletedCount ?? 0);
    }, Promise.resolve(0));
    return { ok: true, deletedCount };
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
