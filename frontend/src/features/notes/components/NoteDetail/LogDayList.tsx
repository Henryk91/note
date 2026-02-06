import React from 'react';
import { DisplayItemBox } from '../NoteItem/NoteItem';

interface LogDayListProps {
  logDayMap: Record<string, any[]> | null;
  setDate: (type: string, date: string) => void;
}

export const LogDayList: React.FC<LogDayListProps> = ({
  setDate,
  logDayMap,
}) => {
  if (!logDayMap) return null;
  const logDayProp = 'Log Days';
  const logDays = Object.keys(logDayMap).map((key) => {
    return { date: key, count: logDayMap[key]?.length };
  });
  return (
    <>
      {[...logDays.reverse()]?.map((item, ind) => {
        return (
          <div onClick={() => setDate(logDayProp, item.date)} key={item.date + logDayProp + ind}>
            <div className="noteTagBox">
              <DisplayItemBox item={item.date} count={item.count} onEdit={() => {}} />
            </div>
          </div>
        );
      })}
    </>
  );
};
