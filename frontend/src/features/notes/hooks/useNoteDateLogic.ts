import { useState, useCallback, useMemo, useEffect } from 'react';
import { NoteItemType, KeyValue, Note } from '../../../shared/utils/Helpers/types';

type UseNoteDateLogicProps = {
  person: Note | null;
  persons: Record<string, Note>;
  searchTerm?: string;
  saveShowTag: (tagName: string) => void;
};

export const useNoteDateLogic = ({ person, persons, searchTerm, saveShowTag }: UseNoteDateLogicProps) => {
  const [displayDate, setDisplayDate] = useState<Date | string | null>(null);
  const [showLogDaysBunch, setShowLogDaysBunch] = useState(false);
  // Removed unused state for prevDate/nextDate as they are derived

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

  // Derived state for logDayMap
  const { logDayMap, totalLogCount } = useMemo(() => {
    const logItem = person?.dataLable?.find((item) => item.name === 'Log');
    if (!logItem) return { logDayMap: null, totalLogCount: 0 };

    const allDates = getDataLableFilteredAndSorted(persons?.[logItem.id]?.dataLable, 'Log', searchTerm);

    let map: KeyValue<NoteItemType[]> = {};
    allDates.forEach((item) => {
      const dateString = item?.content?.date?.substring(0, 15).trim();
      if (dateString) {
        if (!map[dateString]) map[dateString] = [];
        map[dateString].push(item);
      }
    });

    return { logDayMap: map, totalLogCount: allDates.length };
  }, [person?.dataLable, persons, searchTerm, getDataLableFilteredAndSorted]);
  // Note: removed displayDate from dependencies to avoid loop, initialization logic needs to be separate

  // Initialization Effect for Date
  useEffect(() => {
    const logItem = person?.dataLable?.find((item) => item.name === 'Log');
    if (!logItem) return;

    if (displayDate === null) {
      const allDates = getDataLableFilteredAndSorted(persons?.[logItem.id]?.dataLable, 'Log', searchTerm);
      let lastDate = [...allDates].slice(allDates.length - 1);
      if (lastDate[0]) {
        const newSelectedDate = new Date(lastDate[0]?.content?.date + '');
        if (newSelectedDate) setDisplayDate(newSelectedDate);
      }
    }
  }, [person, persons, searchTerm, displayDate, getDataLableFilteredAndSorted]);

  const { prevDateDerived, nextDateDerived } = useMemo(() => {
    if (!displayDate || !person) return { prevDateDerived: null, nextDateDerived: null };
    const logItem = person.dataLable?.find((item) => item.name === 'Log');
    if (!logItem) return { prevDateDerived: null, nextDateDerived: null };

    const allDates = getDataLableFilteredAndSorted(persons?.[logItem.id]?.dataLable, 'Log', searchTerm);
    if (!allDates.length) return { prevDateDerived: null, nextDateDerived: null };

    const currentDateStr = new Date(displayDate as any).toDateString();

    // Find the first occurrence of the current date
    const firstMatchIndex = allDates.findIndex(
      (d) => new Date(d?.content?.date || '').toDateString() === currentDateStr,
    );

    let prev: string | null = null;
    let next: string | null = null;

    if (firstMatchIndex >= 0) {
      // Prev: The item immediately before the first occurrence of current date must be a different (older) date
      if (firstMatchIndex > 0) {
        prev = allDates[firstMatchIndex - 1]?.content?.date || null;
      }

      // Next: Scan forward from first match to find the first DIFFERENT date
      for (let i = firstMatchIndex + 1; i < allDates.length; i++) {
        const itemDate = allDates[i]?.content?.date;
        if (itemDate && new Date(itemDate).toDateString() !== currentDateStr) {
          next = itemDate;
          break;
        }
      }
    }

    return { prevDateDerived: prev, nextDateDerived: next };
  }, [displayDate, person, persons, searchTerm, getDataLableFilteredAndSorted]);

  // Update dateBackForward to use derived dates
  const dateBackForward = useCallback(
    (event: any, direction: string) => {
      event.preventDefault();
      if (displayDate) {
        let dateObj: Date | null = null;
        if (direction === 'back') {
          if (prevDateDerived) dateObj = new Date(prevDateDerived);
        } else {
          // forward
          if (nextDateDerived) dateObj = new Date(nextDateDerived);
        }

        if (dateObj) {
          let dateToChangeTo = `${dateObj}`;
          dateToChangeTo = dateToChangeTo.substring(0, 16).trim();
          setDate('Log Days', dateToChangeTo);
        }
      }
    },
    [displayDate, prevDateDerived, nextDateDerived, setDate],
  );

  return {
    displayDate,
    setDisplayDate,
    showLogDaysBunch,
    setShowLogDaysBunch,
    prevDate: prevDateDerived,
    nextDate: nextDateDerived,
    logDayMap,
    totalLogCount,
    getDataLableFilteredAndSorted,
    setDate,
    changeDate,
    dateBackForward,
    showLogDays,
  };
};
