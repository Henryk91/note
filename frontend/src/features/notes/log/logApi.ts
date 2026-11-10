import { useCallback, useSyncExternalStore } from 'react';
import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { notesKeys } from '../hooks/useNotesQueries';
import { sendOrQueueJSON, getAllRequests } from '../../../offlineQueue/queue';
import { NoteItemType, ItemType } from '../../../shared/utils/Helpers/types';
import { toastNotifications, formatApiError } from '../../../shared/utils/toast';
import { LogEntry, toIsoWithOffset } from './logModel';

// ---- pending (not yet synced) entries: shown as a small clock on the row ----------------------------

let pending = new Set<string>();
const listeners = new Set<() => void>();
let pollTimer: ReturnType<typeof setInterval> | null = null;

const emit = () => {
  pending = new Set(pending);
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => pending;

const markPending = (id: string) => {
  pending.add(id);
  emit();
};
const clearPending = (id: string) => {
  if (pending.delete(id)) emit();
};

/** Queued writes stay "pending" until the offline queue is empty again. */
const watchQueued = (ids: string[]) => {
  if (pollTimer) return;
  pollTimer = setInterval(async () => {
    try {
      const left = await getAllRequests();
      if (left.length === 0) {
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = null;
        ids.forEach((i) => pending.delete(i));
        pending.clear();
        emit();
      }
    } catch {
      /* keep polling */
    }
  }, 3000);
};

export const markPendingId = markPending;
export const clearPendingId = clearPending;

export const usePendingEntries = () => useSyncExternalStore(subscribe, getSnapshot);

// ---- cache helpers ----------------------------------------------------------------------------------

type CacheShape = { notes: Record<string, { id: string; heading?: string; dataLable: NoteItemType[] }> } | undefined;

export const patchLog = (qc: QueryClient, logId: string, fn: (items: NoteItemType[]) => NoteItemType[]) => {
  qc.setQueryData(notesKeys.withChildren(logId), (old: CacheShape) => {
    const current = old?.notes?.[logId];
    const items = current?.dataLable ?? [];
    return {
      ...(old ?? {}),
      notes: {
        ...(old?.notes ?? {}),
        [logId]: { id: logId, heading: current?.heading ?? '', ...current, dataLable: fn(items) },
      },
    };
  });
};

export const newItemId = (parentId: string, type: ItemType) =>
  `${parentId}::${type}::${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;

// ---- mutations --------------------------------------------------------------------------------------

export type LogMutations = {
  create: (text: string, ts: number) => Promise<string>;
  update: (entry: LogEntry, text: string, ts: number) => Promise<void>;
  remove: (entry: LogEntry) => Promise<void>;
  /** Undo of a delete: the same create call with the same id, text and date. */
  restore: (entry: LogEntry) => Promise<void>;
};

const track = (id: string, result: { queued: boolean }) => {
  if (result.queued) {
    markPending(id);
    watchQueued([id]);
  } else {
    clearPending(id);
  }
};

export const trackQueued = track;

/**
 * Create / edit / delete log entries with an optimistic update. Writes go through the offline queue
 * (`sendOrQueueJSON`): a network error or being offline queues them, an HTTP error rolls the change back.
 */
export const useLogMutations = (logId: string): LogMutations => {
  const qc = useQueryClient();

  const create = useCallback(
    async (text: string, ts: number) => {
      const item = {
        id: newItemId(logId, ItemType.LOG),
        parentId: logId,
        type: ItemType.LOG,
        content: { data: text, date: toIsoWithOffset(ts) },
      } as NoteItemType;
      patchLog(qc, logId, (items) => [...items, item]);
      markPending(item.id);
      try {
        const res = await sendOrQueueJSON<NoteItemType>('/api/note-v2', item, { method: 'POST' });
        track(item.id, res);
        if (!res.queued && res.response?.id) {
          patchLog(qc, logId, (items) => items.map((i) => (i.id === item.id ? { ...i, ...res.response } : i)));
        }
      } catch (err) {
        clearPending(item.id);
        patchLog(qc, logId, (items) => items.filter((i) => i.id !== item.id));
        toastNotifications.error(`Failed to add entry: ${formatApiError(err)}`);
      }
      return item.id;
    },
    [qc, logId],
  );

  const update = useCallback(
    async (entry: LogEntry, text: string, ts: number) => {
      const before = entry.raw;
      const after = { ...before, content: { ...(before.content ?? {}), data: text, date: toIsoWithOffset(ts) } } as NoteItemType;
      patchLog(qc, logId, (items) => items.map((i) => (i.id === entry.id ? after : i)));
      markPending(entry.id);
      try {
        // Same id, never deleted and re-created.
        const res = await sendOrQueueJSON('/api/note-v2', { id: entry.id, content: after.content }, { method: 'PUT' });
        track(entry.id, res);
      } catch (err) {
        clearPending(entry.id);
        patchLog(qc, logId, (items) => items.map((i) => (i.id === entry.id ? before : i)));
        toastNotifications.error(`Failed to save entry: ${formatApiError(err)}`);
      }
    },
    [qc, logId],
  );

  const remove = useCallback(
    async (entry: LogEntry) => {
      patchLog(qc, logId, (items) => items.filter((i) => i.id !== entry.id));
      markPending(entry.id);
      try {
        const res = await sendOrQueueJSON('/api/note-v2', { id: entry.id, type: 'LOG' }, { method: 'DELETE' });
        track(entry.id, res);
      } catch (err) {
        clearPending(entry.id);
        patchLog(qc, logId, (items) => [...items, entry.raw]);
        toastNotifications.error(`Failed to delete entry: ${formatApiError(err)}`);
      }
    },
    [qc, logId],
  );

  const restore = useCallback(
    async (entry: LogEntry) => {
      patchLog(qc, logId, (items) => (items.some((i) => i.id === entry.id) ? items : [...items, entry.raw]));
      markPending(entry.id);
      try {
        const { content, parentId, type } = entry.raw;
        const res = await sendOrQueueJSON('/api/note-v2', { id: entry.id, parentId, type, content }, { method: 'POST' });
        track(entry.id, res);
      } catch (err) {
        clearPending(entry.id);
        patchLog(qc, logId, (items) => items.filter((i) => i.id !== entry.id));
        toastNotifications.error(`Failed to restore entry: ${formatApiError(err)}`);
      }
    },
    [qc, logId],
  );

  return { create, update, remove, restore };
};
