import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotesWithChildren, notesKeys } from '../hooks/useNotesQueries';
import { buildFolderChain } from '../hooks/useFolderUrlSync';
import { sendOrQueueJSON } from '../../../offlineQueue/queue';
import { NoteItemType } from '../../../shared/utils/Helpers/types';
import { buildEntries, detectMode, groupByDay, LogMode, LogSettings } from './logModel';

export const isLogId = (id: string | undefined | null) => !!id && /::Log$/.test(id);

/**
 * Loads one log (the whole log, once, then cached) and the log folder's own document, which holds `settings`.
 * Entries are always sorted by their parsed date.
 */
export const useLogData = (logId: string) => {
  const qc = useQueryClient();
  const chain = useMemo(() => buildFolderChain(logId), [logId]);
  const parentId = chain.length > 1 ? chain[chain.length - 2] : '';

  const { data, isLoading, refetch } = useNotesWithChildren(logId, true);
  const { data: parentData } = useNotesWithChildren(parentId || undefined, !!parentId);

  const items: NoteItemType[] | undefined = data?.notes?.[logId]?.dataLable;
  const entries = useMemo(() => buildEntries(items), [items]);
  const grouped = useMemo(() => groupByDay(entries), [entries]);

  const parentNotes = parentData?.notes?.[parentId];
  const folderDoc = parentNotes?.dataLable?.find((d: NoteItemType) => d.id === logId) as
    | (NoteItemType & { settings?: LogSettings })
    | undefined;
  const settings: LogSettings = folderDoc?.settings ?? {};
  const mode: LogMode = settings.mode ?? detectMode(entries);

  const notebook = chain[0];
  const parentName = parentNotes?.heading || (parentId ? parentId.split('::').pop() : '');
  const label = !parentId || parentId === notebook ? notebook : `${notebook} / ${parentName}`;

  const saveSettings = useCallback(
    async (next: LogSettings) => {
      qc.setQueryData(notesKeys.withChildren(parentId), (old: any) => {
        if (!old?.notes?.[parentId]) return old;
        return {
          ...old,
          notes: {
            ...old.notes,
            [parentId]: {
              ...old.notes[parentId],
              dataLable: old.notes[parentId].dataLable.map((d: any) => (d.id === logId ? { ...d, settings: next } : d)),
            },
          },
        };
      });
      await sendOrQueueJSON('/api/note-v2', { id: logId, settings: next }, { method: 'PUT' });
    },
    [qc, parentId, logId],
  );

  return { entries, grouped, settings, mode, label, parentId, isLoading, saveSettings, loaded: !!items, refetch };
};
