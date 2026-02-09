import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi, NotesResponse } from '../api/notesApi';
import { Note } from '../../../shared/utils/Helpers/types';
import { toastNotifications, formatApiError } from '../../../shared/utils/toast';
import { processGetAllNotes, allNotesToItems } from '../../../shared/utils/Helpers/utils';
import { useEffect } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { setByIdState, setPersonById, removePersonById } from '../../auth/store/personSlice';

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
    staleTime: 30 * 1000, // 30 seconds
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

      const keys = Object.keys(rawData);
      keys.forEach((key) => {
        let logFolder = null;
        rawData[key].dataLable = rawData[key].dataLable.filter((item: any) => {
          const isLog = item.type === 'FOLDER' && item.name === 'Log';
          if (isLog) logFolder = item;
          return !isLog;
        });
        if (logFolder !== null) {
          rawData[key].dataLable.unshift(logFolder); // Ensure Log folder is always first
        }
      });

      return {
        notes: rawData
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
  const dispatch = useDispatch();
  const store = useStore();

  return useMutation({
    mutationFn: notesApi.createNote,
    onMutate: async (newNote: any) => {
      // Optimistic update
      if (newNote && newNote.id) {
        const noteToStore = { ...newNote, dataLable: newNote.dataLable || [] };
        dispatch(setPersonById({ id: newNote.id, person: noteToStore }));
      }
      return { tempId: newNote.id };
    },
    onSuccess: (newNote) => {
      // Sync with server response
      if (newNote && newNote.id) {
        dispatch(setPersonById({ id: newNote.id, person: newNote }));
      }
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
    },
    onError: (error, _newNote, context) => {
      // Rollback
      if ((context as any)?.tempId) {
        dispatch(removePersonById({ id: (context as any).tempId }));
      }
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
  const dispatch = useDispatch();
  const store = useStore();

  return useMutation({
    mutationFn: notesApi.updateNote,
    onMutate: async (updatedNote: any) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: notesKeys.detail(updatedNote.id) });

      // Snapshot the previous value
      const previousNote = (store.getState() as any).person.byId[updatedNote.id];

      // Optimistic update
      if (updatedNote && updatedNote.id) {
        dispatch(setPersonById({ id: updatedNote.id, person: updatedNote }));
      }

      return { previousNote };
    },
    onSuccess: (updatedNote) => {
      if (updatedNote && updatedNote.id) {
        dispatch(setPersonById({ id: updatedNote.id, person: updatedNote }));
      }
      if (updatedNote.id) {
        queryClient.invalidateQueries({ queryKey: notesKeys.detail(updatedNote.id) });
      }
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
    },
    onError: (error, _updatedNote, context) => {
      // Rollback
      if ((context as any)?.previousNote) {
        dispatch(setPersonById({ id: (context as any).previousNote.id, person: (context as any).previousNote }));
      }
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
  const dispatch = useDispatch();
  const store = useStore();

  return useMutation({
    mutationFn: notesApi.deleteNote,
    onMutate: async (noteToDelete: any) => {
      // Snapshot the previous value
      const previousNote = (store.getState() as any).person.byId[noteToDelete.id] || noteToDelete;

      // Optimistic update
      if (noteToDelete && noteToDelete.id) {
        dispatch(removePersonById({ id: noteToDelete.id }));
      }

      return { previousNote };
    },
    onSuccess: (_, deletedNote) => {
      // Ensure it's removed (idempotent)
      if (deletedNote && deletedNote.id) {
        dispatch(removePersonById({ id: deletedNote.id }));
      }
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
    },
    onError: (error, _noteToDelete, context) => {
      // Rollback
      if ((context as any)?.previousNote) {
        dispatch(setPersonById({ id: (context as any).previousNote.id, person: (context as any).previousNote }));
      }
      const message = formatApiError(error);
      toastNotifications.error(`Failed to delete note: ${message}`);
      console.error('Failed to delete note:', error);
    },
  });
}
