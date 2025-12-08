import React, { useEffect, useMemo, useState } from 'react';
import NoteItem from '../NoteItem/NoteItem';
import { Note, NoteContent, NoteItemType, PageDescriptor } from '../../Helpers/types';
import PageContent from './PageContent';
import { NoteDetailListItem } from './forms';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import {
  getAllPersonById,
  removePersonById,
  selectPersonById,
  setEditName,
  setPersonById,
  setShowAddItem,
  setShowTag,
  triggerLastPageReload,
} from '../../../../store/personSlice';
import { addFolder, addItem, deleteItem, updateItem } from '../../Helpers/crud';

type Match = {
  isExact: boolean;
  params: { id: string };
  path: string;
  url: string;
};

type NoteDetailProps = {
  searchTerm?: string;
  set: (payload: any) => void;
  openPage: (payload: any) => void;
  lastPage: boolean;
  index?: number;
  showAddItem: boolean;
  pageCount: number;
  match: Match;
  initShowtag: PageDescriptor;
};

type LogDay = { date: string; count: number };

const NoteDetail: React.FC<NoteDetailProps> = ({
  searchTerm,
  set,
  openPage,
  lastPage,
  index,
  showAddItem,
  match,
  initShowtag,
}) => {
  const dispatch = useDispatch();
  const person = useSelector((state: RootState) => selectPersonById(state, initShowtag?.params.id));
  const persons = useSelector((state: RootState) => getAllPersonById(state));
  const { pages, showTag, editName, selectedNoteName } = useSelector((state: RootState) => state.person);

  const [addLable, setAddLable] = useState<any>(null);
  const [displayDate, setDisplayDate] = useState<Date | string | null>(null);
  const [continueData, setContinueData] = useState<any>(null);
  const [showLogDaysBunch, setShowLogDaysBunch] = useState(false);
  const [searchTermState, setSearchTermState] = useState<string | undefined>(searchTerm);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);

  function enableAnimationCheck(tag: string | null, prop: string) {
    if (tag === prop && tag !== '' && prop !== 'Log') return 'grow';
    if (tag === prop && tag !== '' && prop === 'Log') return 'growb';
    return '';
  }

  const noteItemsBunch = (animate, logDaysBunch, bunch, showLogDaysBunchLocal) => (
    <div className={`${animate}`}>
      {showLogDaysBunchLocal && logDaysBunch}
      {!showLogDaysBunchLocal && bunch}
    </div>
  );

  function customScrollBy(element, startPosition, endPosition) {
    window.scrollTo({ top: 0 });
    const left = startPosition > endPosition;
    let i = startPosition;
    const int = setInterval(() => {
      element.scrollTo({ top: 0, left: i });
      if (left) {
        i -= 8;
      } else {
        i += 8;
      }
      if (left && i <= endPosition) clearInterval(int);
      if (!left && i >= endPosition) clearInterval(int);
    }, 1);
  }

  function getDataLableFilteredAndSorted(dataLable: NoteItemType[], prop: string, term?: string) {
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
  }

  function clearShowTag() {
    localStorage.removeItem('showTag');
    dispatch(setShowTag(null));
  }

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

  function openDetailOnNewPage(personParam: Note | null) {
    if (!personParam) return;
    const parentId = personParam.id;

    openPage({
      personNext: personParam,
      parentId,
      showNote: true,
      hideNote: true,
    });
  }

  function handleLinkClick(tagData, currentPerson) {
    const noteId = tagData.id;
    const personNext = persons[noteId];
    const parentId = currentPerson.id;
    openPage({ personNext, parentId, hideNote: true });
  }

  function createLogDateSelectorLines(items: LogDay[], selectedDate: string, showButton: boolean) {
    const max = items.length;
    const selectedDateString = `${selectedDate}`.substring(0, 15).trim();
    if (items[0] === undefined) return '';
    const prop = 'Log Days';

    return items?.map((item, ind) => {
      if ((item as LogDay).date === selectedDateString) {
        const prevItemLocal = ind > -1 ? items[ind - 1] : null;
        const nextItemLocal = ind < max ? items[ind + 1] : null;
        setPrevDate(prevItemLocal?.date ?? null);
        setNextDate(nextItemLocal?.date ?? null);
      }

      const key = item.date + prop + ind;
      return (
        <div onClick={() => setDate(prop, item.date)} key={key}>
          <NoteItem
            nextItem={undefined}
            prevItem={undefined}
            item={item}
            date={selectedDate}
            show={showButton && lastPage}
            set={updateNoteItem}
            cont={continueLog}
            type={prop}
            index={ind}
            count={item.count}
          />
        </div>
      );
    });
  }

  function createNoteLogLineItems(items: NoteItemType[], prop: string, selectedDate: string, showButton: boolean) {
    const max = items.length;

    if (items[0] === undefined) return '';

    return items?.map((item, ind) => {
      const prevItemLocal = ind > -1 ? items[ind - 1] : null;
      const nextItemLocal = ind < max ? items[ind + 1] : null;

      const key = item + prop + ind;
      return (
        <div onClick={() => setDate(prop, item?.content?.date + '')} key={key}>
          <NoteItem
            nextItem={nextItemLocal}
            prevItem={prevItemLocal}
            item={item?.content}
            date={selectedDate}
            show={showButton && lastPage}
            set={updateNoteItem}
            cont={continueLog}
            type={prop}
            index={ind}
            count={0}
          />
        </div>
      );
    });
  }

  function logDayBunchLogic(prop: string, selectedDate: Date | string | null, allDates: any[]) {
    let newSelectedDate = selectedDate;
    let newLogDaysBunch;

    if (prop === 'Log') {
      if (selectedDate === null) {
        let lastDate = [...allDates].slice(allDates.length - 1);
        if (lastDate[0]) {
          newSelectedDate = new Date(lastDate[0].content.date);
          if (newSelectedDate) setDisplayDate(newSelectedDate);
        }
      }
      const allLogDays = [...allDates].map((item) => item.content.date.substring(0, 15).trim());

      const logDaysTemp = [...allLogDays].filter((v, ind, s) => s.indexOf(v) === ind);

      const logDays = [...logDaysTemp].map((day) => {
        const total = allLogDays.filter((allDay) => allDay === day).length;
        return { date: day, count: total };
      });

      let selDate = `${new Date(newSelectedDate as any)}`;
      selDate = selDate.substring(0, 15).trim();
      const logDaysBunch = createLogDateSelectorLines(
        logDays.reverse(),
        newSelectedDate?.toString() ?? '',
        showLogDaysBunch
      );

      let selDates = [...allDates].filter((val) => val.content.date.includes(selDate));
      if (selDates.length > 0) {
        selDates = selDates.slice(selDates.length - 2);
        const contData = selDates[0].content.data;
        setContinueData(contData);
      }
      newLogDaysBunch = logDaysBunch;
    }
    return { selectedDate: newSelectedDate, logDaysBunch: newLogDaysBunch };
  }

  function saveShowTag(tagName: string) {
    if (!person) return;
    dispatch(setShowTag(tagName));
  }

  function showHideBox(prop: string) {
    if (prop !== 'Log') showTagChange(prop);
  }

  function showTagChange(tagName: string) {
    const localPerson = person;
    const tagData = localPerson?.dataLable.find((note) => note.name === tagName);
    dispatch(setShowTag(tagName));
    if (tagData?.type === 'FOLDER' && editName === false) {
      handleLinkClick(tagData, localPerson);
      // clearShowTag();
    } else {
      const sessionShowTag = localStorage.getItem('showTag');
      if (lastPage) {
        dispatch(setShowTag(tagName));
        openDetailOnNewPage(localPerson);
      } else if (sessionShowTag && tagName && sessionShowTag !== tagName) {
        dispatch(setShowTag(tagName));

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
  }

  function changeDate(e) {
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
  }

  function updateNoteItem(val) {
    const dataLable = val.type === 'Log'? persons?.[person.dataLable.find(item => item.name === 'Log')?.id ?? 0]?.dataLable: person.dataLable;
    if (!dataLable) return;
    const noteItem = dataLable.find((item) => item.content?.data === val.oldItem.data);
    if (!noteItem) return;
    if (val.delete) {
      deleteItem(noteItem, () => {
        if(val.type === 'Log') dispatch(removePersonById({id: noteItem.parentId}));
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
  }

  function continueLog(val) {
    setAddLable(val.cont);
    dispatch(setShowAddItem(true));
    window.scrollTo(0, 0);
  }

  function submitNameChange(e) {
    e.preventDefault();
    const heading = e.target.heading.value;

    const parentId = pages[pages.length - 2]?.params?.id;
    let currentNote = {...persons[parentId].dataLable.find(d => d.id === person?.id)};

    dispatch(setEditName(false));
    if (currentNote && currentNote.name !== heading) {
      currentNote.name = heading;
      updateItem(currentNote as NoteItemType, () => {
        dispatch(triggerLastPageReload());
      });
    }
  }

  function submitNewItem(event) {
    event.preventDefault();
    let currentPerson = person ? { ...person } : null;
    if (!currentPerson) return;

    let number = event.target.number.value;
    const tag = event.target.tagType.value;
    const textTag = event?.target?.tagTypeText?.value;

    let content: NoteContent = { data: number };

    if (number.includes(';base64,')) {
      const b64 = number.substring(number.indexOf('base64') + 7);
      number = `${window.atob(b64)}<br />${number}`;
    }

    if (tag === 'Link') {
      addFolder(textTag, currentPerson.id, (data) => {
        setAddLable(null);
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

    addItem(content, currentPerson.id, (data) => {
      setAddLable(null);
      dispatch(setShowAddItem(false));

      if (data?.parentId === currentPerson.id) {
        const updated = { ...currentPerson, dataLable: [...currentPerson.dataLable, data] };
        dispatch(setPersonById({ id: `${currentPerson.id}`, person: updated }));
      } else {
        dispatch(triggerLastPageReload());
      }
    });
  }

  function dateBackForward(event, direction) {
    event.preventDefault();
    if (displayDate) {
      let dateObj = new Date(displayDate as any);
      if (direction === 'back') {
        if (nextDate) {
          dateObj = new Date(nextDate);
        } else {
          dateObj.setDate(dateObj.getDate() - 1);
        }
      } else if (prevDate) {
        dateObj = new Date(prevDate);
      } else {
        // On last date so don't change
        // dateObj.setDate(dateObj.getDate() + 1);
        return;
      }

      let dateToChangeTo = `${dateObj}`;
      dateToChangeTo = dateToChangeTo.substring(0, 16).trim();
      setDate('Log Days', dateToChangeTo);
    }
  }

  function showLogDays(tag) {
    if (person && tag === 'Log') {
      setShowLogDaysBunch((prev) => !prev);
      setTimeout(() => {
        saveShowTag('');
      }, 10);
    }
  }

  function initPage() {
    const noteDetailPage = document.getElementById('multiple-pages');
    if (noteDetailPage && lastPage) {
      // setTimeout(() => {
      const localNoteDetailPage = document.getElementById('multiple-pages');
      if (!localNoteDetailPage) return;
      // if (!localNoteDetailPage || !lastPage) return;
      // const pageWidth = localNoteDetailPage.scrollWidth / pageCount;
      // const start = localNoteDetailPage.scrollWidth - pageWidth - pageWidth;
      // const end = start + pageWidth;
      // customScrollBy(localNoteDetailPage, start, end);
      localNoteDetailPage.scrollTo({
        left: localNoteDetailPage.scrollWidth * 2,
        behavior: 'smooth',
      });
      // }, 30);
    }
  }

  function cancelAddItemEdit() {
    dispatch(setShowAddItem(false));
    setAddLable(null);
    localStorage.removeItem('new-folder-edit');
  }

  useEffect(() => {
    initPage();
  }, []);

  useEffect(() => {
    setSearchTermState(searchTerm);
  }, [searchTerm]);

  const isNoteNames = match?.url === '/notes/note-names';
  const personToRender = isNoteNames ? null : person;

  const completeLogContent = (noteItem) => {
    const prop = noteItem.name ?? noteItem.content.data;

    if (prop !== 'Log') return {};

    const showTagValue = showTag ?? selectedNoteName ?? 'main';

    let allDates = getDataLableFilteredAndSorted(persons?.[noteItem.id]?.dataLable, prop, searchTermState);

    const animate = enableAnimationCheck(showTagValue, prop);

    const { selectedDate, logDaysBunch } = logDayBunchLogic(prop, displayDate, allDates);

    let bunch = createNoteLogLineItems(allDates, prop, selectedDate?.toString() ?? '', showTagValue === prop);

    const logContent = noteItemsBunch(animate, logDaysBunch, bunch, showLogDaysBunch);
    return { logContent, count: bunch.length };
  };

  const tags = useMemo(() => {
    const ret = person?.dataLable?.map((noteItem, i) => {
      let isLink = noteItem.type === 'FOLDER';
      let isNote = noteItem.type === 'NOTE';
      const linkBorder = isLink ? 'link-border' : '';
      const prop = noteItem.name ?? noteItem?.content?.data ?? 'Unknown';

      const key = prop + i;

      const dateItem = noteItem.content?.data;

      const { logContent, count } = completeLogContent(noteItem);

      return (
        <div className={'detailedBox'} key={key}>
          {isLink && (
            <>
              <NoteDetailListItem
                linkBorder={linkBorder}
                prop={prop}
                isLink={isLink}
                contentCount={count ?? 0}
                continueData={continueData}
                onShowHide={() => showHideBox(prop)}
                onShowLogDays={() => showLogDays(prop)}
                onShowLogTag={(tag) => saveShowTag(tag)}
                onChangeDate={changeDate}
                onDateBackForward={(e, dir) => dateBackForward(e, dir)}
                onContinueLog={(payload) => continueLog(payload)}
              />
              {logContent}
            </>
          )}
          {isNote && (
            <div onClick={() => setDate(prop, dateItem)} key={key}>
              <NoteItem
                nextItem={undefined}
                prevItem={undefined}
                item={noteItem.content}
                date={displayDate?.toString() ?? ''}
                show={lastPage}
                set={updateNoteItem}
                cont={continueLog}
                type={prop}
                index={i}
                count={0}
              />
            </div>
          )}
        </div>
      );
    });
    return ret;
  }, [
    person?.dataLable,
    showTag,
    displayDate,
    nextDate,
    prevDate,
    showLogDaysBunch,
    searchTermState,
    lastPage,
    selectedNoteName,
  ]);

  return (
    <div className="slide-in">
      {personToRender && (
        <PageContent
          person={personToRender}
          showAddItem={showAddItem}
          tags={tags}
          addLable={addLable}
          index={index}
          lastPage={lastPage}
          submitNameChange={submitNameChange}
          submitNewItem={submitNewItem}
          cancelAddItemEdit={cancelAddItemEdit}
        />
      )}
    </div>
  );
};

export default NoteDetail;
