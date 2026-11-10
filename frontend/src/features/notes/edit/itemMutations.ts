import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sendOrQueueJSON } from '../../../offlineQueue/queue';
import { ItemType, NoteItemType } from '../../../shared/utils/Helpers/types';
import { formatApiError, toastNotifications } from '../../../shared/utils/toast';
import { notesKeys } from '../hooks/useNotesQueries';
import { clearPendingId, markPendingId, newItemId, patchLog, trackQueued } from '../log/logApi';

// ---- "Saving... / Saved" indicator ------------------------------------------------------------------

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline';

let inflight = 0;
let queuedFlag = false;
let everSaved = false;
let status: SaveStatus = 'idle';
const listeners = new Set<() => void>();

const recompute = () => {
  const next: SaveStatus = inflight > 0 ? 'saving' : queuedFlag ? 'offline' : everSaved ? 'saved' : 'idle';
  if (next !== status) {
    status = next;
    listeners.forEach((l) => l());
  }
};

export const beginSave = () => {
  inflight += 1;
  recompute();
};
export const endSave = (result?: { queued?: boolean; failed?: boolean }) => {
  inflight = Math.max(0, inflight - 1);
  if (result?.queued) queuedFlag = true;
  else if (!result?.failed) {
    queuedFlag = false;
    everSaved = true;
  }
  recompute();
};
export const useSaveStatus = (): SaveStatus =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
  );
export const resetSaveStatusForTests = () => {
  inflight = 0;
  queuedFlag = false;
  everSaved = false;
  status = 'idle';
};

// ---- mutations on the items of one folder -----------------------------------------------------------

export type ItemMutations = {
  create: (type: ItemType, text: string, id?: string, extra?: Partial<NoteItemType>) => Promise<string>;
  /** Replaces the text of a NOTE (autosave). */
  updateText: (item: NoteItemType, text: string) => Promise<void>;
  rename: (item: NoteItemType, name: string) => Promise<void>;
  remove: (item: NoteItemType) => Promise<void>;
  restore: (item: NoteItemType) => Promise<void>;
  /** Moves an item (PUT parentId) from this folder into another one. The id stays the same. */
  move: (item: NoteItemType, newParentId: string) => Promise<void>;
};

/**
 * Create / edit / delete / restore the items of one folder with an optimistic cache update. Writes go through the
 * offline queue: a network error queues them, an HTTP error rolls the change back.
 */
export const useItemMutations = (folderId: string): ItemMutations => {
  const qc = useQueryClient();

  const create = useCallback<ItemMutations['create']>(
    async (type, text, id, extra) => {
      const itemId = id ?? newItemId(folderId, type);
      // Folders have no content (an empty `data` string is rejected by the schema's `required`).
      const item = {
        id: itemId,
        parentId: folderId,
        type,
        ...(type === ItemType.FOLDER ? {} : { content: { data: text } }),
        ...extra,
      } as NoteItemType;
      patchLog(qc, folderId, (items) => (items.some((i) => i.id === itemId) ? items : [...items, item]));
      markPendingId(itemId);
      beginSave();
      try {
        const res = await sendOrQueueJSON<NoteItemType>('/api/note-v2', item, { method: 'POST' });
        trackQueued(itemId, res);
        endSave({ queued: res.queued });
        if (!res.queued && res.response?.id) {
          patchLog(qc, folderId, (items) => items.map((i) => (i.id === itemId ? { ...i, ...res.response } : i)));
        }
      } catch (err) {
        clearPendingId(itemId);
        endSave({ failed: true });
        patchLog(qc, folderId, (items) => items.filter((i) => i.id !== itemId));
        toastNotifications.error(`Failed to save: ${formatApiError(err)}`);
      }
      return itemId;
    },
    [qc, folderId],
  );

  const updateText = useCallback<ItemMutations['updateText']>(
    async (item, text) => {
      const before = item;
      const after = { ...item, content: { ...(item.content ?? {}), data: text } } as NoteItemType;
      patchLog(qc, folderId, (items) => items.map((i) => (i.id === item.id ? after : i)));
      markPendingId(item.id);
      beginSave();
      try {
        const res = await sendOrQueueJSON('/api/note-v2', { id: item.id, content: after.content }, { method: 'PUT' });
        trackQueued(item.id, res);
        endSave({ queued: res.queued });
      } catch (err) {
        clearPendingId(item.id);
        endSave({ failed: true });
        patchLog(qc, folderId, (items) => items.map((i) => (i.id === item.id ? before : i)));
        toastNotifications.error(`Failed to save: ${formatApiError(err)}`);
      }
    },
    [qc, folderId],
  );

  const rename = useCallback<ItemMutations['rename']>(
    async (item, name) => {
      const before = item;
      patchLog(qc, folderId, (items) => items.map((i) => (i.id === item.id ? { ...i, name, heading: name } : i)));
      beginSave();
      try {
        const res = await sendOrQueueJSON('/api/note-v2', { id: item.id, name }, { method: 'PUT' });
        endSave({ queued: res.queued });
      } catch (err) {
        endSave({ failed: true });
        patchLog(qc, folderId, (items) => items.map((i) => (i.id === item.id ? before : i)));
        toastNotifications.error(`Failed to rename: ${formatApiError(err)}`);
      }
    },
    [qc, folderId],
  );

  const remove = useCallback<ItemMutations['remove']>(
    async (item) => {
      patchLog(qc, folderId, (items) => items.filter((i) => i.id !== item.id));
      beginSave();
      try {
        // Soft delete on the server (a folder takes its whole subtree with it); restorable from Recently Deleted.
        const res = await sendOrQueueJSON('/api/note-v2', { id: item.id, type: item.type }, { method: 'DELETE' });
        endSave({ queued: res.queued });
      } catch (err) {
        endSave({ failed: true });
        patchLog(qc, folderId, (items) => (items.some((i) => i.id === item.id) ? items : [...items, item]));
        toastNotifications.error(`Failed to delete: ${formatApiError(err)}`);
      }
    },
    [qc, folderId],
  );

  const restore = useCallback<ItemMutations['restore']>(
    async (item) => {
      patchLog(qc, folderId, (items) => (items.some((i) => i.id === item.id) ? items : [...items, item]));
      beginSave();
      try {
        const res = await sendOrQueueJSON('/api/note-v2', { id: item.id, deletedAt: null }, { method: 'PUT' });
        endSave({ queued: res.queued });
      } catch (err) {
        endSave({ failed: true });
        patchLog(qc, folderId, (items) => items.filter((i) => i.id !== item.id));
        toastNotifications.error(`Failed to restore: ${formatApiError(err)}`);
      }
    },
    [qc, folderId],
  );

  const move = useCallback<ItemMutations['move']>(
    async (item, newParentId) => {
      if (item.id === newParentId || item.parentId === newParentId) return;
      const moved = { ...item, parentId: newParentId } as NoteItemType;
      patchLog(qc, folderId, (items) => items.filter((i) => i.id !== item.id));
      // The destination list is only patched if it is already loaded; otherwise it simply loads fresh later.
      if (qc.getQueryData(notesKeys.withChildren(newParentId))) {
        patchLog(qc, newParentId, (items) => (items.some((i) => i.id === item.id) ? items : [...items, moved]));
      }
      beginSave();
      try {
        const res = await sendOrQueueJSON('/api/note-v2', { id: item.id, parentId: newParentId }, { method: 'PUT' });
        endSave({ queued: res.queued });
        qc.invalidateQueries({ queryKey: [...notesKeys.all, 'path'] });
      } catch (err) {
        endSave({ failed: true });
        patchLog(qc, folderId, (items) => (items.some((i) => i.id === item.id) ? items : [...items, item]));
        patchLog(qc, newParentId, (items) => items.filter((i) => i.id !== item.id));
        toastNotifications.error(`Failed to move: ${formatApiError(err)}`);
      }
    },
    [qc, folderId],
  );

  return useMemo(
    () => ({ create, updateText, rename, remove, restore, move }),
    [create, updateText, rename, remove, restore, move],
  );
};
