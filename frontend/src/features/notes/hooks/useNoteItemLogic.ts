import { useState, useCallback, useEffect, useRef } from 'react';
import { NoteItemType, NoteContent } from '../../../shared/utils/Helpers/types';

type UseNoteItemLogicProps = {
  item: NoteItemType;
  index: number;
  type: string;
  set: (payload: any) => void;
  show: boolean;
};

export const useNoteItemLogic = ({ item: initialItem, index, type, set, show }: UseNoteItemLogicProps) => {
  const [item, setItem] = useState<NoteItemType | null>(initialItem);
  const [editingItem, setEditingItem] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const removeHideClass = useCallback(() => {
    const nodes = document.querySelectorAll('.hidden-noteItemBox');
    nodes.forEach((node) => node.classList.remove('hidden-noteItemBox'));
    window.scrollTo({ top: scrollPos });
  }, [scrollPos]);

  const hideLogLines = useCallback(() => {
    const nodes = document.querySelectorAll('.noteItemBox');
    nodes.forEach((node) => node.classList.add('hidden-noteItemBox'));
  }, []);

  const setEditState = useCallback(() => {
    setEditingItem(true);
    setScrollPos(window.scrollY);
    hideLogLines();
    window.scrollTo({ top: 0 });
  }, [hideLogLines]);

  const closeEdit = useCallback(() => {
    setEditingItem(false);
    removeHideClass();
  }, [removeHideClass]);

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
      removeHideClass();
    },
    [item, index, type, set, removeHideClass],
  );

  const deleteItemHandler = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (confirm('Are you sure you want to permanently delete this?')) {
        setItem(null);
        setScrollPos(window.scrollY);
        set({
          oldItem: item,
          index,
          type,
          delete: true,
        });
        removeHideClass();
      }
    },
    [item, index, type, set, removeHideClass],
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
    }
  }, [show, editingItem]);

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
