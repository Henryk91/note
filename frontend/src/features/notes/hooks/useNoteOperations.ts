import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import {
  removePersonById,
  setEditName,
  setPersonById,
  setShowAddItem,
  triggerLastPageReload,
  setShowTag,
  setNewNoteMode,
} from '../../auth/store/personSlice';
import { Note, NoteContent, NoteItemType, ItemType } from '../../../shared/utils/Helpers/types';
import { useCreateNote, useDeleteNote, useUpdateNote } from './useNotesQueries';

type UseNoteOperationsProps = {
  person: Note | null;
  index: number;
  openPage: (msg: any) => void; // needed for delete redirect
};

export const useNoteOperations = ({ person, index, openPage }: UseNoteOperationsProps) => {
  const dispatch = useDispatch();
  const { pages, showTag, byId } = useSelector((state: RootState) => state.person);
  const persons = byId;

  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  const [addLabel, setAddLabel] = useState<any>(null);

  const updateNoteItem = useCallback(
    (val: any) => {
      const dataLable =
        val.type === 'Log'
          ? persons?.[person?.dataLable.find((item) => item.name === 'Log')?.id ?? 0]?.dataLable
          : person?.dataLable;
      if (!dataLable) return;
      const noteItem = dataLable.find((item) => item.id === val.oldItem.id);
      if (!noteItem) return;
      if (val.delete) {
        deleteNoteMutation.mutate(noteItem as any, {
          onSuccess: () => {
            if (val.type === 'Log') dispatch(removePersonById({ id: noteItem.parentId }));
            dispatch(triggerLastPageReload());
          },
        });
        return;
      }

      const updatedItem = {
        ...noteItem,
        content: noteItem?.content ? { ...val.item } : val.item,
      };

      updateNoteMutation.mutate(updatedItem as any, {
        onSuccess: () => {
          dispatch(triggerLastPageReload());
        },
      });
    },
    [person, persons, dispatch, deleteNoteMutation, updateNoteMutation],
  );

  const continueLog = useCallback(
    (val: any) => {
      setAddLabel(val.cont);
      dispatch(setShowAddItem(true));
      window.scrollTo(0, 0);
    },
    [dispatch],
  );

  const submitNameChange = useCallback(
    (e: any) => {
      e.preventDefault();
      const heading = e.target.heading.value;

      const parentId = pages[pages.length - 2]?.params?.id;
      let currentNote = persons[parentId]?.dataLable?.find((d) => d.id === person?.id);
      if (currentNote) {
        currentNote = { ...currentNote };
      }

      dispatch(setEditName(false));
      if (currentNote && currentNote.name !== heading) {
        const noteToUpdate = {
          ...currentNote,
          heading: heading,
          name: heading,
          dataLable: persons[currentNote.id]?.dataLable || [],
        };

        // Snapshot state for rollback
        const originalParentNote = persons[parentId];
        const originalShowTag = showTag;

        // Optimistic Update: Parent's dataLable
        if (originalParentNote && originalParentNote.dataLable) {
          const updatedDataLable = originalParentNote.dataLable.map((item) => {
            if (item.id === currentNote.id) {
              return { ...item, name: heading, heading: heading };
            }
            return item;
          });
          const updatedParent = { ...originalParentNote, dataLable: updatedDataLable };
          dispatch(setPersonById({ id: parentId, person: updatedParent as any }));
        }

        // Optimistic Update: showTag
        if (showTag === currentNote.name || showTag === currentNote.heading) {
          dispatch(setShowTag(heading));
        }

        updateNoteMutation.mutate(noteToUpdate as any, {
          onSuccess: () => {
            dispatch(triggerLastPageReload());
          },
          onError: () => {
            // Rollback
            if (originalParentNote) {
              dispatch(setPersonById({ id: parentId, person: originalParentNote }));
            }
            if (originalShowTag) {
              dispatch(setShowTag(originalShowTag));
            }
          },
        });
      }

      if (e.nativeEvent.submitter.value === 'delete' && currentNote) {
        if (confirm('Are you sure you want to permanently delete this folder?')) {
          deleteNoteMutation.mutate(currentNote as any, {
            onSuccess: () => {
              if (person) {
                openPage({ personNext: { id: person.id }, parentId: person.id, hideNote: true });
              }
            },
          });
        }
      }
    },
    [dispatch, pages, persons, person, showTag, updateNoteMutation, deleteNoteMutation, openPage],
  );

  const submitNewItem = useCallback(
    (event: any) => {
      event.preventDefault();
      let currentPerson = person ? { ...person } : null;
      if (!currentPerson) return;

      let number = event.target.number?.value;
      const tag = event.target.tagType.value;
      const textTag = event?.target?.tagTypeText?.value;

      let content: NoteContent = { data: number };

      if (number?.includes(';base64,')) {
        const b64 = number.substring(number.indexOf('base64') + 7);
        number = `${window.atob(b64)}<br />${number}`;
      }

      if (tag === 'Link') {
        const newItem: NoteItemType = {
          id: currentPerson.id + '::' + ItemType.FOLDER + '::' + Date.now().toString(),
          name: textTag.trim(),
          parentId: currentPerson.id,
          type: ItemType.FOLDER,
          heading: textTag.trim(),
          content: { data: '' },
        };

        const updatedParent = {
          ...currentPerson,
          dataLable: [...(currentPerson.dataLable || []), newItem],
        };
        dispatch(setPersonById({ id: currentPerson.id, person: updatedParent }));

        createNoteMutation.mutate(newItem as any, {
          onSuccess: (data) => {
            setAddLabel(null);
            dispatch(setShowAddItem(false));
            if (!(data as any)?.parentId || (data as any)?.parentId !== currentPerson?.id) {
              dispatch(triggerLastPageReload());
            }
          },
          onError: () => {
            if (currentPerson) {
              dispatch(setPersonById({ id: currentPerson.id, person: currentPerson }));
            }
          },
        });
        return;
      }

      if (!number || !currentPerson?.id) return;

      if (tag === 'Log') content.date = textTag;
      dispatch(setShowAddItem(false));

      const noteType = content.date ? ItemType.LOG : ItemType.NOTE;

      const logFolder = currentPerson.dataLable?.find((item) => item.name === 'Log' && item.type === ItemType.FOLDER);

      let targetParentId = currentPerson.id;
      let originalLogFolder: any = null;

      if (logFolder && noteType === ItemType.LOG) {
        targetParentId = logFolder.id;
        originalLogFolder = persons?.[logFolder.id] || logFolder;
      }

      const newItem: NoteItemType = {
        id: targetParentId + '::' + noteType + '::' + Date.now().toString(),
        content: content,
        parentId: targetParentId,
        type: noteType,
        heading: '',
      };

      if (logFolder && noteType === ItemType.LOG && originalLogFolder) {
        const updatedLogFolder = {
          ...originalLogFolder,
          dataLable: [...(originalLogFolder.dataLable || []), newItem],
        };
        dispatch(setPersonById({ id: targetParentId, person: updatedLogFolder as any }));
      } else {
        const updatedParent = {
          ...currentPerson,
          dataLable: [...(currentPerson.dataLable || []), newItem],
        };
        dispatch(setPersonById({ id: currentPerson.id, person: updatedParent }));
      }

      createNoteMutation.mutate(newItem as any, {
        onSuccess: (data) => {
          setAddLabel(null);
          if (!(data as any)?.parentId || (data as any)?.parentId !== targetParentId) {
            dispatch(triggerLastPageReload());
          }
        },
        onError: () => {
          if (logFolder && noteType === ItemType.LOG && originalLogFolder) {
            dispatch(setPersonById({ id: targetParentId, person: originalLogFolder as any }));
          } else if (currentPerson) {
            dispatch(setPersonById({ id: currentPerson.id, person: currentPerson }));
          }
        },
      });
    },
    [person, persons, dispatch, createNoteMutation],
  );

  const cancelAddItemEdit = useCallback(() => {
    dispatch(setShowAddItem(false));
    setAddLabel(null);
    dispatch(setNewNoteMode(null));
  }, [dispatch]);

  return {
    addLabel,
    setAddLabel,
    updateNoteItem,
    continueLog,
    submitNameChange,
    submitNewItem,
    cancelAddItemEdit,
  };
};
