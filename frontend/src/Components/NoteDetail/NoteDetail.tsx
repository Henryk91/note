import React, { useEffect, useMemo, useState } from 'react';
import NoteItem from '../NoteItem/NoteItem';
import { KeyValue, Note, NoteContent, NoteItemType, PageDescriptor } from '../../Helpers/types';
import PageContent from './PageContent';
import { NoteDetailListItem } from './forms';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  getAllPersonById,
  removePersonById,
  selectPersonById,
  setEditName,
  setPersonById,
  setShowAddItem,
  setShowTag,
  triggerLastPageReload,
} from '../../store/personSlice';
import { addFolder, addItem, deleteItem, updateItem } from '../../Helpers/crud';
import { checkIsSameDate } from '../../Helpers/utils';

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
  const [totalLogCount, setTotalLogCount] = useState<number>(0);
  const [logDayMap, setLogDayMap] = useState<KeyValue<NoteItemType[]> | null>(null);

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
    openPage({ personNext: { id: tagData.id }, parentId: currentPerson.id, hideNote: true });
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
            item={{date: item.date }}
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

  const createNoteLogLineItems = (showButton: boolean) => {
    const checkDate = displayDate?.toString().substring(0, 15).trim();
    if(!logDayMap || !checkDate) return;
    const filteredItems = logDayMap?.[checkDate]? [...logDayMap[checkDate]]: []
    const max = filteredItems.length;

    return [...filteredItems]?.map((item, ind) => {
      const prevItemLocal = ind > -1 ? filteredItems[ind - 1] : null;
      const nextItemLocal = ind < max ? filteredItems[ind + 1] : null;

      const key = item.id + "Log" + ind;

      return (
        <div onClick={() => setDate("Log", item?.content?.date + '')} key={key}>
          <NoteItem
            nextItem={nextItemLocal}
            prevItem={prevItemLocal}
            item={item?.content}
            date={checkDate}
            show={showButton && lastPage}
            set={updateNoteItem}
            cont={continueLog}
            type={"Log"}
            index={ind}
            count={0}
          />
        </div>
      );
    });
  }

  const logDayBunchLogic = () => {
      if (!logDayMap) return []
      const logDays = Object.keys(logDayMap).map(key => {
        return {date: key, count: logDayMap[key]?.length}
      })

      let selDate = `${new Date(displayDate as any)}`;
      selDate = selDate.substring(0, 15).trim();
      const logDaysBunch = createLogDateSelectorLines(
        logDays.reverse(),
        displayDate?.toString() ?? '',
        showLogDaysBunch
      );


      let selDates = logDayMap[selDate];
      if (selDates && selDates.length > 0) {
        selDates = selDates.slice(selDates.length - 2);
        const contData = selDates[0]?.content?.data;
        setContinueData(contData);
      }
      return logDaysBunch;
  }

  function saveShowTag(tagName: string) {
    if (!person) return;
    if(tagName === 'Log') setShowLogDaysBunch(false);
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
      window.scrollTo({ top: 0 });
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

  const initLogDayMap = () => {
    const logItem = person?.dataLable.find(item => item.name === 'Log');
    if (!logItem) return 0;
    
    let allDates = getDataLableFilteredAndSorted(persons?.[logItem.id]?.dataLable, 'Log', searchTermState);
    if (displayDate === null) {
      let lastDate = [...allDates].slice(allDates.length - 1);
      if (lastDate[0]) {
        const newSelectedDate = new Date(lastDate[0]?.content?.date +"");
        if (newSelectedDate) setDisplayDate(newSelectedDate);
      }
    }

    let map = {};
    allDates.forEach(item => {
      const dateString = item?.content?.date?.substring(0, 15).trim();
      if(dateString){
        if(!map[dateString]) map[dateString] = []
        map[dateString].push(item)
      }
    })

    setLogDayMap(map);
    setTotalLogCount(allDates.length)
    return allDates.length ?? 1
  }

  useEffect(() => {
    initLogDayMap();
  },[person?.dataLable])

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

    if (prop !== 'Log') return <></>;

    const showTagValue = showTag ?? selectedNoteName ?? 'main';
    const animate = enableAnimationCheck(showTagValue, prop);
    const logDaysBunch = logDayBunchLogic();
    let bunch = createNoteLogLineItems(showTagValue === prop);

    return noteItemsBunch(animate, logDaysBunch, bunch, showLogDaysBunch);
  };

  const tags = useMemo(() => {
    return person?.dataLable?.map((noteItem, i) => {
      let isLink = noteItem.type === 'FOLDER';
      let isNote = noteItem.type === 'NOTE';
      let isLogDirectory = noteItem.name === 'Log';
      const linkBorder = isLink ? 'link-border' : '';
      const prop = noteItem.name ?? noteItem?.content?.data ?? 'Unknown';

      const key = prop + noteItem.id + i;

      const dateItem = noteItem.content?.data;

      const logContent = completeLogContent(noteItem);
      const contentCount = isLogDirectory? totalLogCount: persons?.[noteItem.id]?.dataLable?.length

      return (
        <div className={'detailedBox'} key={key}>
          {isLink && (
            <>
              <NoteDetailListItem
                linkBorder={linkBorder}
                prop={prop}
                isLink={isLink}
                contentCount={contentCount}
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
                count={contentCount}
              />
            </div>
          )}
        </div>
      );
    });
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
    logDayMap,
    totalLogCount
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
