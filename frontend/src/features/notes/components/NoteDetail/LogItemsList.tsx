import React from 'react';
import LogItem from '../NoteItem/LogItem';

interface LogItemsListProps {
  showButton: boolean;
  isLastPage: boolean;
  displayDate: Date | string | null;
  logDayMap: Record<string, any[]> | null;
  updateNoteItem: (payload: any) => void;
  continueLog: (payload: any) => void;
}

export const LogItemsList: React.FC<LogItemsListProps> = ({
  displayDate,
  showButton,
  isLastPage,
  updateNoteItem,
  continueLog,
  logDayMap,
}) => {
  const checkDate = displayDate?.toString().substring(0, 15).trim();
  if(!checkDate) return null;
  const filteredItems = logDayMap?.[checkDate] ? [...logDayMap[checkDate]] : [];

  const max = filteredItems.length;

  return (
    <>
      {[...filteredItems]?.map((item, ind) => {
        const prevItemLocal = ind > -1 ? filteredItems[ind - 1] : undefined;
        const nextItemLocal = ind < max ? filteredItems[ind + 1] : undefined;

        return (
          <div key={item.id + 'Log' + ind}>
            <LogItem
              nextItem={nextItemLocal}
              prevItem={prevItemLocal}
              item={item}
              date={checkDate}
              show={showButton && isLastPage}
              set={updateNoteItem}
              cont={continueLog}
              type={'Log'}
              index={ind}
            />
          </div>
        );
      })}
    </>
  );
};
