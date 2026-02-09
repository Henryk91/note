import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { useCreateNote, useUpdateNote } from './useNotesQueries';
import { Note } from '../../../shared/utils/Helpers/types';

import { setSelectedNoteName } from '../../auth/store/personSlice';
import { useDispatch } from 'react-redux';

/**
 * Hook for managing note actions (Create, Update, Delete)
 */
export const useNotesActions = () => {
  const dispatch = useDispatch();

  const updateNoteMutation = useUpdateNote();
  const createNoteMutation = useCreateNote();

  const updateNote = useCallback(
    (update: any) => {
      let person: Note | null = null;
      if (update.updateData) {
        person = update.updateData;
      } else if (update.person) {
        person = update.person;
      } else {
        person = update;
      }

      if (person) {
        updateNoteMutation.mutate(person);
      }
    },
    [updateNoteMutation],
  );

  const noteDetailSet = useCallback(
    (msg: any) => {
      if (msg.noteName) {
        dispatch(setSelectedNoteName(msg.noteName));
      } else {
        updateNote(msg);
      }
    },
    [updateNote, dispatch],
  );

  return {
    updateNote,
    noteDetailSet,
    isUpdating: updateNoteMutation.status === 'pending',
    isCreating: createNoteMutation.status === 'pending',
  };
};
