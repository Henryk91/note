import React, { useMemo, useEffect } from 'react';
import NoteItem from '../NoteItem/NoteItem';
import { FolderList } from './forms';
import { Note } from '../../../../shared/utils/Helpers/types';
import { useSelector } from 'react-redux';
import { getAllPersonById } from '../../../auth/store/personSlice';
import { CompleteLogContent } from './CompleteLogContent';

interface NoteDetailTagsProps {
  person: Note;
  totalLogCount: number;
  displayDate: Date | string | null;
  isLastPage: boolean;
  showLogDaysBunch: boolean;
  logDayMap: Record<string, any[]> | null;
  actions: {
    showHideBox: (prop: string) => void;
    showLogDays: (prop: string) => void;
    saveShowTag: (tag: string) => void;
    changeDate: (e: any) => void;
    dateBackForward: (e: any, dir: string) => void;
    continueLog: (payload: any) => void;
    setDate: (type: string, date: string) => void;
    updateNoteItem: (payload: any) => void;
    enableAnimationCheck: (tag: string | null, prop: string) => string;
    setPrevDate: (date: string | null) => void;
    setNextDate: (date: string | null) => void;
  };
}

const NoteDetailTags: React.FC<NoteDetailTagsProps> = ({
  person,
  totalLogCount,
  displayDate,
  isLastPage,
  showLogDaysBunch,
  logDayMap,
  actions,
}) => {
  const persons = useSelector(getAllPersonById);
  const {
    showHideBox,
    showLogDays,
    saveShowTag,
    changeDate,
    dateBackForward,
    continueLog,
    setDate,
    updateNoteItem,
    enableAnimationCheck,
    setPrevDate,
    setNextDate,
  } = actions;

  const calculatedContinueData = useMemo(() => {
    if (!logDayMap || !displayDate) return null;
    let selDate = `${new Date(displayDate as any)}`;
    selDate = selDate.substring(0, 15).trim();
    let selDates = logDayMap[selDate];
    if (selDates && selDates.length > 0) {
      selDates = selDates.slice(selDates.length - 2);
      return selDates[0]?.content?.data;
    }
    return null;
  }, [logDayMap, displayDate]);

  useEffect(() => {
    if (!logDayMap || !displayDate) return;

    const logDays = Object.keys(logDayMap)
      .map((key) => ({ date: key, count: logDayMap[key]?.length }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const selectedDateString = `${displayDate}`.substring(0, 15).trim();
    const ind = logDays.findIndex((item) => item.date === selectedDateString);

    if (ind !== -1) {
      const prevItemLocal = ind > 0 ? logDays[ind - 1] : undefined;
      const nextItemLocal = ind < logDays.length - 1 ? logDays[ind + 1] : undefined;
      setPrevDate(prevItemLocal?.date ?? null);
      setNextDate(nextItemLocal?.date ?? null);
    }
  }, [logDayMap, displayDate, setPrevDate, setNextDate]);

  return (
    <div className={'detailedBox'}>
      {person?.dataLable?.map((noteItem, i) => {
        
        const isLink = noteItem.type === 'FOLDER';
        const isNote = noteItem.type === 'NOTE';
        const isLogDirectory = noteItem.name === 'Log';
        const prop = (noteItem as any).heading ?? noteItem.name ?? noteItem?.content?.data ?? 'Unknown';
        const contentCount = isLogDirectory ? totalLogCount : persons?.[noteItem.id]?.dataLable?.length;

        return (
          <div className={'detailedBox'} key={(noteItem.id || prop) + i}>
            {isLink && (
              <>
                <FolderList
                  linkBorder={'link-border'}
                  prop={prop}
                  contentCount={contentCount}
                  onShowHide={() => showHideBox(prop)}
                  onShowLogDays={() => showLogDays(prop)}
                  onShowLogTag={(tag) => saveShowTag(tag)}
                  onChangeDate={changeDate}
                />
                <CompleteLogContent
                  contentCount={contentCount}
                  continueData={calculatedContinueData}
                  onDateBackForward={(e, dir) => dateBackForward(e, dir)}
                  onContinueLog={(payload) => continueLog(payload)}
                  noteItem={noteItem}
                  logDayMap={logDayMap}
                  showLogDaysBunch={showLogDaysBunch}
                  displayDate={displayDate}
                  isLastPage={isLastPage}
                  actions={{
                    setDate,
                    updateNoteItem,
                    continueLog,
                    enableAnimationCheck,
                  }}
                />
              </>
            )}
            {isNote && (
              <NoteItem
                item={noteItem}
                show={isLastPage}
                set={updateNoteItem}
                type={prop}
                index={i}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NoteDetailTags;
