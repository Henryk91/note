import { useState, useCallback, useEffect, useRef } from 'react';
import { NoteItemType, NoteContent } from '../../../shared/utils/Helpers/types';

type UseNoteItemLogicProps = {
  item: NoteItemType;
  index: number;
  type: string;
  set: (payload: any) => void;
  show: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
};

export const useNoteItemLogic = ({
  item: initialItem,
  index,
  type,
  set,
  show,
  onEditStart,
  onEditEnd,
}: UseNoteItemLogicProps) => {
  const [item, setItem] = useState<NoteItemType | null>(initialItem);
  const [editingItem, setEditingItem] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const setEditState = useCallback(() => {
    setEditingItem(true);
    setScrollPos(window.scrollY);

    // Call parent callback to hide others
    if (onEditStart) onEditStart();

    window.scrollTo({ top: 0 });
  }, [onEditStart]);

  const closeEdit = useCallback(() => {
    setEditingItem(false);

    // Call parent callback to show others
    if (onEditEnd) onEditEnd();

    window.scrollTo({ top: scrollPos });
  }, [onEditEnd, scrollPos]);

  const submitChange = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!item) return;
      const target = e.target as any;
      let update: NoteContent = { data: target.item.value };
      if (target.itemDate) {
        update = { data: target.item.value, date: target?.itemDate?.value };
      }

      set({
        item: { data: target.item.value, date: target?.itemDate?.value },
        oldItem: item,
        index,
        type,
        delete: false,
      });
      setEditingItem(false);
      setItem({ ...item, content: update });

      if (onEditEnd) onEditEnd();
      window.scrollTo({ top: scrollPos });
    },
    [item, index, type, set, onEditEnd, scrollPos],
  );

  const deleteItemHandler = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (confirm('Are you sure you want to permanently delete this?')) {
        setItem(null);
        set({
          oldItem: item,
          index,
          type,
          delete: true,
        });

        if (onEditEnd) onEditEnd();
        window.scrollTo({ top: scrollPos });
      }
    },
    [item, index, type, set, onEditEnd, scrollPos],
  );

  const changeDate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const selectedDate = e.target.value;
    const newDate = new Date(selectedDate);
    // Use ref instead of getElementById
    if (dateInputRef.current) {
      dateInputRef.current.value = `${newDate}`;
    } else {
      // Fallback or if ref not attached yet/component structure changes
      const textDate = document.getElementById('text-date') as HTMLInputElement;
      if (textDate) textDate.value = `${newDate}`;
    }
  }, []);

  const addLeadingZero = (number: number) => {
    if (number < 10) return `0${number}`;
    return number;
  };

  const dateToInputDisplayDate = (inputDate: Date) => {
    if (!inputDate || Number.isNaN(Number(inputDate))) return '';
    const minutes = addLeadingZero(inputDate.getMinutes());
    const hours = addLeadingZero(inputDate.getHours());
    return `${inputDate.toISOString().split('T')[0]}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (!show && editingItem) {
      setEditingItem(false);
      if (onEditEnd) onEditEnd();
    }
  }, [show, editingItem, onEditEnd]);

  return {
    item,
    editingItem,
    setEditState,
    closeEdit,
    submitChange,
    deleteItemHandler,
    changeDate,
    dateToInputDisplayDate,
    dateInputRef,
    setItem, // exposed if needed
    setEditingItem, // exposed if needed
  };
};
