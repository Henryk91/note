import React, { useEffect, useMemo, useState } from 'react';
import NoteItem from '../NoteItem/NoteItem';
import { getPersonNoteType } from '../../Helpers/utils';
import { Note, PageDescriptor } from '../../Helpers/types';
import PageContent from './PageContent';
import { NoteDetailListItem } from './forms';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { getAllPersonById, selectPersonById, setEditName, setPersonById, setShowAddItem, setShowTag } from '../../../../store/personSlice';

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
  pageCount,
  match,
  initShowtag,
}) => {
  const dispatch = useDispatch();
  // console.log('initShowtag',initShowtag);
  const person = useSelector((state: RootState) => selectPersonById(state, initShowtag?.params.tempId));
  console.log('useSelector person',person);
  const persons = useSelector((state: RootState) => getAllPersonById(state));
  // console.log('persons',persons);
  const { notes, noteNames, showTag, editName, selectedNoteName } = useSelector((state: RootState) => state.person);

  const [addLable, setAddLable] = useState<any>(null);
  const [displayDate, setDisplayDate] = useState<Date | string | null>(null);
  const [continueData, setContinueData] = useState<any>(null);
  const [showLogDaysBunch, setShowLogDaysBunch] = useState(false);
  const [searchTermState, setSearchTermState] = useState<string | undefined>(searchTerm);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);

  function enableAnimationCheck(tag: string | null, prop: string) {
    let animate = '';
    if (tag === prop && tag !== '' && prop !== 'Log') animate = 'grow';
    if (tag === prop && tag !== '' && prop === 'Log') animate = 'growb';
    return animate;
  }

  function isLinkCheck(sort: Record<string, string[]>, prop: string) {
    // console.log('sort?.[prop]?.[0]',sort?.[prop]?.[0]);
    return sort?.[prop]?.[0]?.startsWith('href:');
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

  function getDataFilteredAndSorted(sort: Record<string, string[]>, prop: string, term?: string) {
    let allDates = [...sort[prop]];

    if (term) {
      const lowerSearch = term.toLowerCase();
      allDates = allDates.filter((item) => item?.toLowerCase()?.includes(lowerSearch));
    }

    if (prop !== 'Log') return allDates;
    allDates = allDates
      .filter((d) => d.includes('"json":true'))
      .sort((a, b) => new Date(JSON.parse(a).date).getTime() - new Date(JSON.parse(b).date).getTime());

    return allDates;
  }

  function setLogAndLinksAtTop(sort: Record<string, string[]>) {
    let propertyArray = Object.keys(sort);
    const isFirstPage = index === 0;
    if (isFirstPage) propertyArray.sort();

    if (propertyArray.includes('Log')) {
      propertyArray = propertyArray.filter((prop) => prop !== 'Log');
      propertyArray.unshift('Log');
    }

    let linkProps: string[] = [];
    propertyArray = propertyArray.filter((prop) => {
      const isLink = sort?.[prop]?.[0]?.startsWith('href:');
      if (isLink) {
        linkProps.push(prop);
      }
      return !isLink;
    });
    return { linkProps, propertyArray };
  }

  function clearShowTag() {
    localStorage.removeItem('showTag');
    dispatch(setShowTag(null));
  }

  function setDate(prop: string, date: string | Date) {
    if (prop === 'Log Days') {
      if(date) setDisplayDate(date);
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
    // console.log('tagData',tagData);
    console.log('notes',notes);
    console.log('tagData',tagData);
    const noteId = tagData?.data ? tagData.data.substring(5): tagData.id
    const personNext = notes?.find((note) => note.id === noteId) ?? null;
    console.log('personNext',personNext);
    const parentId = currentPerson.id;
    openPage({ personNext, parentId, hideNote: true });
  }

  function handleLinkButtons(animate: string, isLink: boolean, allDates: string[], bunch: React.JSX.Element[]) {
    let localBunch = bunch;
    if (animate === 'grow' && isLink && !editName) {
      if (allDates?.[0]?.startsWith('href:')) {
        const noteId = allDates[0].substring(5);
        const noteHeadings = notes?.find((note) => note.id === noteId) ?? null;
        const buttons = getNoteByTag(noteHeadings?.dataLable, '');
        localBunch = buttons;
      }
    }
    return localBunch;
  }

  function createNoteItemBunch(items: string[] |  {date: any; count: number;}[], prop: string, selectedDate: string, showButton: boolean) {
    const max = items.length;
    const selectedDateString = `${selectedDate}`.substring(0, 15).trim();
    if (items[0] === undefined) return ""
    console.log('items',items.length);
    return items?.map((item, ind) => {
      const prevItemLocal = ind > -1 ? items[ind - 1] : null;
      const nextItemLocal = ind < max ? items[ind + 1] : null;
      console.log('item',item);
      if ((item as LogDay).date === selectedDateString) {
        setPrevDate(prevItemLocal?.date ?? null);
        setNextDate(nextItemLocal?.date ?? null);
      }

      let count = 0;
      let dateItem: any = item;
      if (prop === 'Log Days') {
        count = (item as LogDay).count;
        dateItem = (item as LogDay).date;
      }
      const key = dateItem + prop + ind;
      return (
        <div onClick={() => setDate(prop, dateItem)} key={key}>
          <NoteItem
            nextItem={nextItemLocal}
            prevItem={prevItemLocal}
            item={dateItem}
            date={selectedDate}
            show={showButton && lastPage}
            set={updateNoteItem}
            cont={continueLog}
            type={prop}
            index={ind}
            count={count}
          />
        </div>
      );
    });
  }

  function logDayBunchLogic(prop: string, selectedDate: Date | string | null, allDates: any[]) {
    let newSelectedDate = selectedDate;
    let newLogDaysBunch;

    if (prop === 'Log') {
      console.log('prop',prop);
      if (selectedDate === null) {
        let lastDate = [...allDates].slice(allDates.length - 1);
        if (lastDate[0]) {
          newSelectedDate = new Date(JSON.parse(lastDate[0]).date);
          if(newSelectedDate)setDisplayDate(newSelectedDate);
        }
      }
      const allLogDays = [...allDates].map((day) => JSON.parse(day).date.substring(0, 15).trim());

      const logDaysTemp = [...allLogDays].filter((v, ind, s) => s.indexOf(v) === ind);

      const logDays = [...logDaysTemp].map((day) => {
        const total = allLogDays.filter((allDay) => allDay === day).length;
        return { date: day, count: total };
      });

      let selDate = `${new Date(newSelectedDate as any)}`;
      selDate = selDate.substring(0, 15).trim();
      const logDaysBunch = createNoteItemBunch(logDays.reverse(), 'Log Days', newSelectedDate?.toString() ?? '', showLogDaysBunch);

      let selDates = [...allDates].filter((val) => val.includes(selDate));
      if (selDates.length > 0) {
        selDates = selDates.slice(selDates.length - 2);
        const contData = JSON.parse(selDates[0]).data;
        setContinueData(contData);
      }
      newLogDaysBunch = logDaysBunch;
    }
    return { selectedDate: newSelectedDate, logDaysBunch: newLogDaysBunch };
  }

  const getNoteByTag = (items, showTagValue: string | null) => {
    if (!items) return [];
    console.log('items',items);
    const sort: Record<string, any[]> = {};
    items.forEach((tag) => {
      console.log('tag',tag);
      if (sort[tag.tag]) {
        sort[tag.tag].push(tag.data);
      } else {
        sort[tag.tag] = [tag.data];
      }
    });
    console.log('sort',sort);

    const listHasShowTag = items.some((item) => item.tag === showTagValue);

    const { linkProps, propertyArray } = setLogAndLinksAtTop(sort);
    const all = [...linkProps, ...propertyArray].map((prop, i) => {
      console.log('prop',prop);
      const showDateSelector = prop === 'Log';

      const showButton = showTagValue === prop;
      console.log('sort',sort);
      let allDates = getDataFilteredAndSorted(sort, prop, searchTermState);
      console.log('allDates',allDates);
      const { selectedDate, logDaysBunch } = logDayBunchLogic(prop, displayDate, allDates);

      const isLink = isLinkCheck(sort, prop);
      const animate = enableAnimationCheck(showTagValue, prop);

      if (showDateSelector && showTagValue === 'Log' && !showLogDaysBunch) {
        const checkSate = `${selectedDate}`.substring(0, 15).trim();
        allDates = allDates.filter((item) => item.includes(checkSate));
      }
      console.log('allDates',allDates);

      let bunch = createNoteItemBunch(allDates, prop, selectedDate?.toString() ?? '', showButton);

      bunch = handleLinkButtons(animate, isLink, allDates, bunch);

      const linkBorder = isLink ? 'link-border' : '';

      const showOnlyNote =
        lastPage && listHasShowTag && showTagValue && showTagValue !== 'Log' && !showLogDaysBunch;

      const key = prop + i;
      return (
        <div className={'detailedBox'} key={key}>
          {!showOnlyNote && (
            <NoteDetailListItem
              linkBorder={linkBorder}
              prop={prop}
              isLink={isLink}
              bunch={bunch}
              showDateSelector={showDateSelector}
              continueData={continueData}
              onShowHide={() => showHideBox(prop)}
              onShowLogDays={() => showLogDays(prop)}
              onShowLogTag={(tag) => saveShowTag(tag)}
              onChangeDate={changeDate}
              onDateBackForward={(e, dir) => dateBackForward(e, dir)}
              onContinueLog={(payload) => continueLog(payload)}
            />
          )}
          {noteItemsBunch(animate, logDaysBunch, bunch, showLogDaysBunch)}
        </div>
      );
    });
    return all;
  };

  function saveShowTag(tagName: string) {
    if (!person) return;
    dispatch(setShowTag(tagName));
  }

  function showHideBox(prop: string) {
    console.log('showHideBox',prop);
    if (prop !== 'Log') showTagChange(prop);
  }

  function showTagChange(tagName: string) {
    const propForId = initShowtag ?? match;
    const localPerson = person? person: getPersonNoteType(notes, propForId)
    console.log('tagName',tagName);
    console.log('localPerson',localPerson);
    const tagData = localPerson?.dataLable.find((note) => note.tag === tagName);
    console.log('tagData',tagData);
    console.log('tagData?.type',tagData?.type,tagData?.type === "FOLDER");
    // if (tagData?.data?.startsWith('href:') && editName === false) {
    if (tagData?.type === "FOLDER" && editName === false) {
      handleLinkClick(tagData, localPerson);
      clearShowTag();
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

    if(dateToChangeTo) setDisplayDate(dateToChangeTo);
    saveShowTag('');

    setTimeout(() => {
      saveShowTag('Log');
    }, 10);
  }

  function updateNoteItem(val) {
    const updateData = JSON.parse(JSON.stringify(person));
    if (updateData) {
      updateData.dataLable = [{ tag: val.type, data: val.oldItem, edit: val.item }];
      if (!val.delete) {
        set({ updateData, edit: val.item });
      } else {
        set({ updateData, delete: true });
      }
    }
  }

  function continueLog(val) {
    setAddLable(val.cont);
    dispatch(setShowAddItem(true));
    window.scrollTo(0, 0);
  }

  function submitNameChange(e) {
    e.preventDefault();
    const heading = e.target.heading.value;
    const updatedPerson = person ? { ...person } : null;
    if (updatedPerson && updatedPerson.heading !== heading) {
      updatedPerson.heading = heading;
      set({ person: updatedPerson });
    } else {
      dispatch(setEditName(false))
    }
  }

  function submitNewItem(event) {
    event.preventDefault();
    let currentPerson = person ? { ...person } : null;
    if (!currentPerson) return;

    let number = event.target.number.value;
    let tag = event.target.tagType.value;
    const textTag = event.target.tagTypeText ? event.target.tagTypeText.value : '';

    if (tag === 'Note' || tag === 'Upload') tag = textTag;

    if (tag === 'Log') {
      number = JSON.stringify({ json: true, date: textTag, data: number });
    }

    if (number.includes(';base64,')) {
      const b64 = number.substring(number.indexOf('base64') + 7);
      number = `${window.atob(b64)}<br />${number}`;
    }

    if (tag === 'Link') {
      const link = event.target.links.value;
      number = `href:${link}`;
      const linkHeading = (document.getElementById('link-text') as HTMLInputElement)?.value;
      tag = linkHeading.startsWith('Sub: ') ? linkHeading.slice(4).trim() : linkHeading;
    }

    const dataLable = [...currentPerson.dataLable];
    dataLable.push({ tag, data: number });
    currentPerson.dataLable = dataLable;
    const updateData = JSON.parse(JSON.stringify(currentPerson));
    updateData.dataLable = [{ tag, data: number }];
    set({ updateData });
    dispatch(setPersonById({ id: `${initShowtag?.params.tempId}`, person: {...currentPerson} }));
    setAddLable(null);
    dispatch(setShowAddItem(false));
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
        dateObj.setDate(dateObj.getDate() + 1);
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
    if (initShowtag) {
      const personFound = getPersonNoteType(notes, initShowtag, selectedNoteName);
      if (personFound) {
        dispatch(setPersonById({ id: `${initShowtag?.params.tempId}`, person: {...personFound} }));
      } else if (noteNames) {
        // Displaying List of Names and Theme types
        dispatch(setShowTag(null));
      }
    }
    const noteDetailPage = document.getElementById('multiple-pages');
    if (noteDetailPage)
      setTimeout(() => {
        const localNoteDetailPage = document.getElementById('multiple-pages');
        if (!localNoteDetailPage) return;
        const pageWidth = localNoteDetailPage.scrollWidth / pageCount;
        const start = localNoteDetailPage.scrollWidth - pageWidth - pageWidth;
        const end = start + pageWidth;
        customScrollBy(localNoteDetailPage, start, end);
      }, 30);
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
  }, [searchTerm,notes]);

  const isNoteNames = match?.url === '/notes/note-names';
  const personToRender = isNoteNames ? null : person;
  // console.log('person',person);
  const getNotesWithMemo = useMemo(() => {
    console.log(index, 'person.dataLable',person?.dataLable);
    console.log('notes',notes);
    const ret = person?.dataLable? getNoteByTag(person.dataLable, showTag ?? selectedNoteName?? 'main'): null
    console.log('retretretret',ret);
    return ret
  }, [person?.dataLable, showTag, displayDate, nextDate, prevDate, showLogDaysBunch, searchTermState, lastPage, selectedNoteName, notes])
  // console.log('personToRender',personToRender);
  return (
    <div className="slide-in">
      {personToRender && (
        <PageContent
          person={personToRender}
          showAddItem={showAddItem}
          tags={getNotesWithMemo}
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
