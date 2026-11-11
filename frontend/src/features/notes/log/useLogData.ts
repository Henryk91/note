import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { useNotesWithChildren, notesKeys } from '../hooks/useNotesQueries';
import { buildFolderChain } from '../hooks/useFolderUrlSync';
import { sendOrQueueJSON } from '../../../offlineQueue/queue';
import { NoteItemType } from '../../../shared/utils/Helpers/types';
import { buildEntries, detectMode, groupByDay, LogMode, LogSettings } from './logModel';

/** `patch` on top of `current`; keys set to `undefined` in the patch are removed. Other keys are kept as they are. */
export const mergeSettings = (current: LogSettings | undefined, patch: Partial<LogSettings>): LogSettings => {
  const next: any = { ...(current ?? {}) };
  Object.entries(patch).forEach(([k, v]) => {
    if (v === undefined) delete next[k];
    else next[k] = v;
  });
  return next;
};

export { isLogId, rememberLogFolders } from './logIds';

/**
 * Loads one log (the whole log, once, then cached) and the log folder's own document, which holds `settings`.
 * Entries are always sorted by their parsed date.
 */
export const useLogData = (logId: string) => {
  const qc = useQueryClient();
  const chain = useMemo(() => buildFolderChain(logId), [logId]);
  const pages = useSelector((state: RootState) => state.person.pages);
  const selectedName = useSelector((state: RootState) => state.person.selectedNoteName) ?? '';
  // The real parent is the previous page of the stack (ids can carry an old notebook prefix); the id is the fallback.
  const last = pages[pages.length - 1]?.params.id === logId;
  const parentId = last && pages.length > 1 ? pages[pages.length - 2].params.id : chain.length > 1 ? chain[chain.length - 2] : '';
  const rootId = last && pages.length > 0 ? pages[0].params.id : chain[0];
  const { data: rootData } = useNotesWithChildren(rootId, !!rootId);

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

  const notebook = rootData?.notes?.[rootId]?.heading || (rootId === pages[0]?.params.id ? selectedName : '') || rootId;
  const parentName = parentNotes?.heading || (parentId ? parentId.split('::').pop() : '');
  const label = !parentId || parentId === notebook ? notebook : `${notebook} / ${parentName}`;

  /**
   * Changes only the keys in `patch` (a key set to `undefined` is removed) on top of the settings currently in the cache.
   * Never writes when the log's own folder document is not loaded: `settings` would then be `{}` and saving would wipe
   * the stored mode (ui-review N1). A log's mode changes only through `patch.mode`, i.e. the user picking one.
   */
  const saveSettings = useCallback(
    async (patch: Partial<LogSettings>) => {
      const cached: any = qc.getQueryData(notesKeys.withChildren(parentId));
      const doc = cached?.notes?.[parentId]?.dataLable?.find((d: any) => d.id === logId);
      if (!doc) return false;
      const next: LogSettings = mergeSettings(doc.settings, patch);
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
      return true;
    },
    [qc, parentId, logId],
  );

  return { entries, grouped, settings, mode, label, parentId, notebook, parentName, isLoading, saveSettings, loaded: !!items, refetch };
};
