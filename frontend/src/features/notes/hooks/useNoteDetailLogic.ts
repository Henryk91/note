import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import {
  removePersonById,
  setEditName,
  setPages,
  setPersonById,
  setShowAddItem,
  setShowTag,
  triggerLastPageReload,
} from '../../../features/auth/store/personSlice';
import { addFolder, addItem, deleteItem, updateItem } from '../../../shared/utils/Helpers/crud';
import { KeyValue, Note, NoteContent, NoteItemType, PageDescriptor } from '../../../shared/utils/Helpers/types';
import { useNotesWithChildren } from './useNotesQueries';

export type LogDay = { date: string; count: number };

type UseNoteDetailLogicProps = {
  searchTerm?: string;
  isLastPage: boolean;
  editName?: boolean;
  index: number
};

export const useNoteDetailLogic = ({
  searchTerm,
  isLastPage,
  editName,
  index,
}: UseNoteDetailLogicProps) => {
  const dispatch = useDispatch();
  const loginKey = typeof window !== 'undefined' ? localStorage.getItem('loginKey') : null;
  const isLoggedIn = !!loginKey;
  const { pages, showTag, selectedNoteName, byId } = useSelector((state: RootState) => state.person);

  const pageLink = pages[index];
  // Fetch data using TanStack Query instead of Redux
  const { data: notesData } = useNotesWithChildren(
    pageLink?.params.id,
    isLoggedIn && !!pageLink?.params.id,
  );

  const tanStackPerson = notesData ? (notesData as any).notes?.[pageLink?.params.id] || (notesData as any).person : null;
  const person = byId ? byId?.[pageLink?.params.id] || tanStackPerson : null;
  const persons = byId;

  const [addLabel, setAddLabel] = useState<any>(null);
  const [displayDate, setDisplayDate] = useState<Date | string | null>(null);
  const [continueData, setContinueData] = useState<any>(null);
  const [showLogDaysBunch, setShowLogDaysBunch] = useState(false);
  const [searchTermState, setSearchTermState] = useState<string | undefined>(searchTerm);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [totalLogCount, setTotalLogCount] = useState<number>(0);
  const [logDayMap, setLogDayMap] = useState<KeyValue<NoteItemType[]> | null>(null);

  // Helper functions
  const enableAnimationCheck = useCallback((tag: string | null, prop: string) => {
    if (tag === prop && tag !== '' && prop !== 'Log') return 'grow';
    if (tag === prop && tag !== '' && prop === 'Log') return 'growb';
    return '';
  }, []);

  const getDataLableFilteredAndSorted = useCallback((dataLable: NoteItemType[], prop: string, term?: string) => {
    let allDates = dataLable ? [...dataLable] : [];

    if (term) {
      const lowerSearch = term.toLowerCase();
      allDates = allDates.filter((item) => {
        return (
          item?.content?.data.toLowerCase()?.includes(lowerSearch) ||
          item?.content?.date?.toLowerCase()?.includes(lowerSearch)
        );
      });
    }

    if (prop !== 'Log') return allDates;
    allDates = allDates
      .filter((d) => d?.content?.date)
      .sort((a, b) => new Date(a?.content?.date + '').getTime() - new Date(b?.content?.date + '').getTime());

    return allDates;
  }, []);

  const clearShowTag = useCallback(() => {
    localStorage.removeItem('showTag');
    dispatch(setShowTag(null));
  }, [dispatch]);

  const saveShowTag = useCallback(
    (tagName: string) => {
      if (!person) return;
      if (tagName === 'Log') setShowLogDaysBunch(false);
      dispatch(setShowTag(tagName));
    },
    [dispatch, person],
  );

  const setDate = useCallback(
    (prop: string, date: string | Date) => {
      if (prop === 'Log Days') {
        if (date) setDisplayDate(date);
        setShowLogDaysBunch(false);
        setTimeout(() => {
          window.scrollTo(0, 0);
          saveShowTag('Log');
        }, 10);
      }
    },
    [saveShowTag],
  );

  // Override setDate to match exact behavior including the likely bug/feature where only 'Log Days' did something
  // or maybe I missed something. Re-reading:
  /*
    function setDate(prop: string, date: string | Date) {
        if (prop === 'Log Days') {
        if (date) setDisplayDate(date);
        setShowLogDaysBunch(false);
        setTimeout(() => {
            window.scrollTo(0, 0);
            saveShowTag('Log');
        }, 10);
        }
    }
  */
  // Yes, it strictly checks 'Log Days'.

  const openPage = useCallback(
      (msg: any) => {
        if (!msg.personNext) return;
  
        const heading = msg.personNext.heading || msg.personNext.name || msg.personNext.id;
        const tempId = `${msg.personNext.id}-${heading}`;
        const nextPage: PageDescriptor = { params: { id: msg.personNext.id, tempId } };
  
        const pageFoundIndex = pages.findIndex((page) => page.params.id === msg.personNext.id);
  
        // If page is not found, add it to the stack
        if (pageFoundIndex === -1) {
          // If we are coming from a parent, we might want to truncate the stack to that parent
          const parentPageIndex = pages.findIndex((page) => page.params.id === msg.parentId);
          let basePages = pages;
          if (parentPageIndex > -1) {
            basePages = pages.slice(0, parentPageIndex + 1);
          }
  
          const newPages =
            basePages.length === 1 && basePages[0].params.id === '' ? [nextPage] : [...basePages, nextPage];
  
          dispatch(setPages(newPages));
  
          // Scroll to the new page after a short delay to allow DOM to update
          const noteDetailPage = document.getElementById('multiple-pages');
          if (noteDetailPage) {
            const scrollOptions: ScrollToOptions = {
              left: noteDetailPage.scrollWidth,
              behavior: 'smooth',
            };
            noteDetailPage.scrollTo(scrollOptions);
  
            // Fallback for slower DOM updates: try again after a bit more time
            setTimeout(() => {
              if (noteDetailPage.scrollLeft < noteDetailPage.scrollWidth - noteDetailPage.clientWidth) {
                noteDetailPage.scrollTo(scrollOptions);
              }
            }, 20);
          }
        } else {
          // Page found - just scroll to it
          const noteDetailPage = document.getElementById('multiple-pages');
          if (noteDetailPage) {
            const pageWidth = noteDetailPage.scrollWidth / pages.length;
            noteDetailPage.scrollTo({
              left: pageWidth * pageFoundIndex,
              behavior: 'smooth',
            });
          }
        }
      },
      [pages, dispatch],
    );

  const openDetailOnNewPage = useCallback(
    (personParam: Note | null) => {
      if (!personParam) return;
      const parentId = personParam.id;

      openPage({
        personNext: personParam,
        parentId,
        showNote: true,
        hideNote: true,
      });
    },
    [openPage],
  );

  const handleLinkClick = useCallback(
    (tagData: any, currentPerson: any) => {
      openPage({
        personNext: { id: tagData.id, heading: tagData.name || tagData.heading },
        parentId: currentPerson.id,
        hideNote: true,
      });
    },
    [openPage],
  );

  const showTagChange = useCallback(
    (tagName: string) => {
      const localPerson = person;

      // Robust lookup for tagData - check name, heading and id
      const tagData = localPerson?.dataLable.find(
        (note) => note.name === tagName || note.heading === tagName || note.id === tagName,
      );

      dispatch(setShowTag(tagName));

      if (tagData?.type === 'FOLDER' || tagData?.id?.includes('FOLDER')) {
        handleLinkClick(tagData, localPerson);
      } else {
        const sessionShowTag = localStorage.getItem('showTag');
        if (isLastPage) {
          openDetailOnNewPage(localPerson);
        } else if (sessionShowTag && tagName && sessionShowTag !== tagName) {
          openPage({
            personNext: localPerson,
            parentId: localPerson?.id,
            showNote: true,
            hideNote: tagName === '',
          });
        } else {
          clearShowTag();
          openDetailOnNewPage(localPerson);
        }
      }
    },
    [person, isLastPage, dispatch, handleLinkClick, openDetailOnNewPage, openPage, clearShowTag],
  );

  const showHideBox = useCallback(
    (prop: string) => {
      if (prop !== 'Log') showTagChange(prop);
    },
    [showTagChange],
  );

  const changeDate = useCallback(
    (e: any) => {
      e.preventDefault();
      const selectedDate = e.target.value;

      const dateObj = new Date(selectedDate);
      let dateToChangeTo = `${dateObj}`;
      dateToChangeTo = dateToChangeTo.substring(0, 16).trim();

      if (dateToChangeTo) setDisplayDate(dateToChangeTo);
      saveShowTag('');

      setTimeout(() => {
        saveShowTag('Log');
      }, 10);
    },
    [saveShowTag],
  );

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
        deleteItem(noteItem, () => {
          if (val.type === 'Log') dispatch(removePersonById({ id: noteItem.parentId }));
          dispatch(triggerLastPageReload());
        });
        return;
      }

      const updatedItem = {
        ...noteItem,
        content: noteItem?.content ? { ...val.item } : val.item,
      };

      updateItem(updatedItem, () => {
        dispatch(triggerLastPageReload());
      });
    },
    [person, persons, dispatch],
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
      let currentNote = { ...persons[parentId]?.dataLable?.find((d) => d.id === person?.id) };

      dispatch(setEditName(false));
      if (currentNote && currentNote.name !== heading) {
        currentNote.name = heading;
        updateItem(currentNote as NoteItemType, () => {
          dispatch(triggerLastPageReload());
        });
      }

      if (e.nativeEvent.submitter.value === 'delete' && currentNote) {
        if (confirm('Are you sure you want to permanently delete this folder?')) {
          // Note: Original code had a commented out scroll back hack or similar
          deleteItem(currentNote as NoteItemType, () => {
            if (person) {
              openPage({ personNext: { id: person.id }, parentId: person.id, hideNote: true });
            }
          });
        }
      }
    },
    [dispatch, pages, persons, person, openPage],
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
        addFolder(textTag, currentPerson.id, (data) => {
          setAddLabel(null);
          dispatch(setShowAddItem(false));
          if (data?.parentId === currentPerson.id) {
            const updated = { ...currentPerson, dataLable: [...currentPerson.dataLable, data] };
            dispatch(setPersonById({ id: `${currentPerson.id}`, person: updated }));
          } else {
            dispatch(triggerLastPageReload());
          }
        });
        return;
      }

      if (!number || !currentPerson?.id) return;

      if (tag === 'Log') content.date = textTag;
      dispatch(setShowAddItem(false));

      addItem(content, currentPerson.id, (data) => {
        setAddLabel(null);

        if (data?.parentId === currentPerson.id) {
          const updated = { ...currentPerson, dataLable: [...currentPerson.dataLable, data] };
          dispatch(setPersonById({ id: `${currentPerson.id}`, person: updated }));
        } else {
          if (data) dispatch(triggerLastPageReload());
        }
      });
    },
    [person, dispatch],
  );

  const dateBackForward = useCallback(
    (event: any, direction: string) => {
      event.preventDefault();
      if (displayDate) {
        let dateObj = new Date(displayDate as any);
        if (direction === 'back') {
          if (nextDate) {
            dateObj = new Date(nextDate);
          }
        } else if (prevDate) {
          dateObj = new Date(prevDate);
        } else {
          return;
        }

        let dateToChangeTo = `${dateObj}`;
        dateToChangeTo = dateToChangeTo.substring(0, 16).trim();
        setDate('Log Days', dateToChangeTo);
      }
    },
    [displayDate, nextDate, prevDate, setDate],
  );

  const showLogDays = useCallback(
    (tag: string) => {
      if (person && tag === 'Log') {
        setShowLogDaysBunch((prev) => !prev);
        setTimeout(() => {
          saveShowTag('');
        }, 10);
      }
    },
    [person, saveShowTag],
  );

  const cancelAddItemEdit = useCallback(() => {
    dispatch(setShowAddItem(false));
    setAddLabel(null);
    localStorage.removeItem('new-folder-edit');
  }, [dispatch]);

  const initLogDayMap = useCallback(() => {
    const logItem = person?.dataLable.find((item) => item.name === 'Log');
    if (!logItem) return 0;

    let allDates = getDataLableFilteredAndSorted(persons?.[logItem.id]?.dataLable, 'Log', searchTermState);
    if (displayDate === null) {
      let lastDate = [...allDates].slice(allDates.length - 1);
      if (lastDate[0]) {
        const newSelectedDate = new Date(lastDate[0]?.content?.date + '');
        if (newSelectedDate) setDisplayDate(newSelectedDate);
      }
    }

    let map = {};
    allDates.forEach((item) => {
      const dateString = item?.content?.date?.substring(0, 15).trim();
      if (dateString) {
        if (!map[dateString]) map[dateString] = [];
        map[dateString].push(item);
      }
    });

    setLogDayMap(map);
    setTotalLogCount(allDates.length);
    return allDates.length ?? 1;
  }, [person?.dataLable, persons, searchTermState, displayDate, getDataLableFilteredAndSorted]);

  const initPage = useCallback(() => {
    // Note: Scroll logic has been moved to NoteDetailPage openPage callback
    // to unify animations and prevent "fighting" scrolls.
  }, []);

  // Effects
  useEffect(() => {
    initLogDayMap();
  }, [initLogDayMap]); // Dependencies managed by useCallback

  useEffect(() => {
    initPage();
  }, [initPage]);

  useEffect(() => {
    setSearchTermState(searchTerm);
  }, [searchTerm]);

  return {
    person,
    persons,
    addLabel,
    displayDate,
    continueData,
    showLogDaysBunch,
    prevDate,
    nextDate,
    totalLogCount,
    logDayMap,
    pages,
    showTag,
    editName,
    selectedNoteName,
    setPrevDate,
    setNextDate,
    setDisplayDate,
    setShowLogDaysBunch,
    setContinueData,
    enableAnimationCheck,
    getDataLableFilteredAndSorted,
    saveShowTag,
    setDate,
    openDetailOnNewPage,
    handleLinkClick,
    showTagChange,
    showHideBox,
    changeDate,
    updateNoteItem,
    continueLog,
    submitNameChange,
    submitNewItem,
    dateBackForward,
    showLogDays,
    cancelAddItemEdit,
  };
};
