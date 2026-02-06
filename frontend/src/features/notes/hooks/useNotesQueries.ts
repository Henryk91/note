import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi, NotesResponse } from '../api/notesApi';
import { Note } from '../../../shared/utils/Helpers/types';
import { toastNotifications, formatApiError } from '../../../shared/utils/toast';
import { processGetAllNotes, allNotesToItems } from '../../../shared/utils/Helpers/utils';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setByIdState } from '../../auth/store/personSlice';

/**
 * Query Keys - Hierarchical structure for easy cache invalidation
 *
 * Examples:
 * - Invalidate all notes: queryClient.invalidateQueries({ queryKey: notesKeys.all })
 * - Invalidate specific list: queryClient.invalidateQueries({ queryKey: notesKeys.list(parentId) })
 */
export const notesKeys = {
  all: ['notes'] as const,
  lists: () => [...notesKeys.all, 'list'] as const,
  list: (parentId?: string) => [...notesKeys.lists(), { parentId }] as const,
  details: () => [...notesKeys.all, 'detail'] as const,
  detail: (id: string) => [...notesKeys.details(), id] as const,
  withChildren: (parentId?: string) => [...notesKeys.all, 'with-children', { parentId }] as const,
  noteNames: () => [...notesKeys.all, 'note-names'] as const,
};

/**
 * Query: Fetch notes by parent ID
 *
 * @param parentId - Parent note ID to fetch children for
 * @param enabled - Whether to enable the query (default: true if parentId exists)
 */
export function useNotes(parentId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: notesKeys.list(parentId),
    queryFn: () => notesApi.getNotesByParentId(parentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!parentId,
  });
}

/**
 * Query: Fetch notes with children (nested structure)
 *
 * @param parentId - Parent note ID to fetch children for
 * @param enabled - Whether to enable the query (default: true if parentId exists)
 */
export function useNotesWithChildren(parentId?: string, enabled: boolean = true) {
  const dispatch = useDispatch();
  const query = useQuery<any>({
    queryKey: notesKeys.withChildren(parentId),
    queryFn: async () => {
      const rawData = await notesApi.getNotesWithChildren(parentId);

      if (!rawData) return { notes: {}, rawData: null };

      let notesMap: any = {};

      const processNote = (note: any) => {
        if (!note.id) return;
        const heading = note.heading || note.name || note.id;
        const processed = {
          ...note,
          heading: heading,
          name: note.name || heading, // Ensure name is also set
        };

        // Normalize nested folders in dataLable for navigation consistency
        if (processed.dataLable && Array.isArray(processed.dataLable)) {
          processed.dataLable = processed.dataLable.map((item: any) => {
            if (item.type === 'FOLDER' || item.id?.includes('FOLDER')) {
              const itemHeading = item.heading || item.name || item.id;
              return {
                ...item,
                heading: itemHeading,
                name: item.name || itemHeading,
              };
            }
            return item;
          });
        }
        notesMap[note.id] = processed;
      };

      // Handle Normalized Map structure or NotesResponse
      if (typeof rawData === 'object' && !Array.isArray(rawData)) {
        const rawNotes = rawData.notes || rawData;
        Object.values(rawNotes).forEach(processNote);
      }
      // Handle Note[] Array (V2 Style)
      else if (Array.isArray(rawData) && rawData.length > 0 && (rawData[0].dataLable || rawData[0].heading)) {
        rawData.forEach(processNote);
      }
      // Handle Legacy flat array (V1 Style)
      else if (Array.isArray(rawData)) {
        const flatNotes = processGetAllNotes(rawData);
        const grouped = allNotesToItems(flatNotes);
        Object.values(grouped).forEach(processNote);
      }

      // Ensure the requested parentId exists in the map for UI traversal
      if (parentId && !notesMap[parentId]) {
        // Use available items as children if we have any
        const hasProcessedItems = Object.keys(notesMap).length > 0;
        notesMap[parentId] = {
          id: parentId,
          heading: parentId,
          dataLable: hasProcessedItems ? Object.values(notesMap) : Array.isArray(rawData) ? rawData : [],
        };
      }

      const keys = Object.keys(notesMap);
      keys.forEach((key) => {
        let logFolder = null;
        notesMap[key].dataLable = notesMap[key].dataLable.filter((item: any) => {
          const isLog = item.type === 'FOLDER' && item.name === 'Log';
          if (isLog) logFolder = item;
          return !isLog;
        });
        if(logFolder !== null) {
          notesMap[key].dataLable.unshift(logFolder); // Ensure Log folder is always first
        }
      })
      return {
        notes: notesMap,
        rawData,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!parentId,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    if (query.data?.notes) {
      dispatch(setByIdState({ byId: query.data.notes }));
    }
  }, [query.data, dispatch]);

  return query;
}

/**
 * Query: Fetch note names (top-level notebooks)
 *
 * @param enabled - Whether to enable the query (default: true)
 */
export function useNoteNames(enabled: boolean = true) {
  return useQuery<string[]>({
    queryKey: notesKeys.noteNames(),
    queryFn: () => notesApi.getNoteNames(),
    staleTime: 10 * 60 * 1000, // 10 minutes (note names change less frequently)
    retry: 2,
    enabled,
  });
}

/**
 * Mutation: Create a new note
 *
 * Automatically invalidates all note lists on success.
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notesApi.createNote,
    onSuccess: () => {
      toastNotifications.success('Note created successfully');
      // Invalidate all note lists to refetch with new note
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
    },
    onError: (error) => {
      const message = formatApiError(error);
      toastNotifications.error(`Failed to create note: ${message}`);
      console.error('Failed to create note:', error);
    },
  });
}

/**
 * Mutation: Update an existing note
 *
 * Automatically invalidates the specific note and all lists on success.
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notesApi.updateNote,
    onSuccess: (updatedNote) => {
      toastNotifications.success('Note updated successfully');
      // Invalidate specific note detail
      if (updatedNote.id) {
        queryClient.invalidateQueries({ queryKey: notesKeys.detail(updatedNote.id) });
      }
      // Invalidate all lists to show updated data
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
    },
    onError: (error) => {
      const message = formatApiError(error);
      toastNotifications.error(`Failed to update note: ${message}`);
      console.error('Failed to update note:', error);
    },
  });
}

/**
 * Mutation: Delete a note
 *
 * Automatically invalidates all note lists on success.
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notesApi.deleteNote,
    onSuccess: () => {
      toastNotifications.success('Note deleted successfully');
      // Invalidate all note lists to remove deleted note
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
    },
    onError: (error) => {
      const message = formatApiError(error);
      toastNotifications.error(`Failed to delete note: ${message}`);
      console.error('Failed to delete note:', error);
    },
  });
}
