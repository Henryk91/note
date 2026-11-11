import React, { useCallback } from 'react';
import toast from 'react-hot-toast';
import { NoteItemType } from '../../../shared/utils/Helpers/types';
import { ItemMutations } from './itemMutations';

/** Delete straight away (soft delete) and offer Undo for ~8 seconds. No confirmation dialog. */
export const useDeleteWithUndo = (mutations: ItemMutations) =>
  useCallback(
    (item: NoteItemType, label = 'Deleted') => {
      void mutations.remove(item);
      toast(
        (t) => (
          <span>
            {label}
            <button
              type="button"
              className="log-toast-undo"
              onClick={() => {
                void mutations.restore(item);
                toast.dismiss(t.id);
              }}
            >
              Undo
            </button>
          </span>
        ),
        { duration: 8000 },
      );
    },
    [mutations],
  );
