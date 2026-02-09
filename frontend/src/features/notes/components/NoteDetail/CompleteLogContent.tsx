import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { LogDayList } from './LogDayList';
import { LogItemsList } from './LogItemsList';
import { LogHeader } from './forms';

interface CompleteLogContentProps {
  noteItem: any;
  logDayMap: Record<string, any[]> | null;
  showLogDaysBunch: boolean;
  displayDate: Date | string | null;
  isLastPage: boolean;
  actions: {
    setDate: (type: string, date: string) => void;
    updateNoteItem: (payload: any) => void;
    continueLog: (payload: any) => void;
  };
  onDateBackForward: (e: React.MouseEvent<HTMLButtonElement>, dir: 'back' | 'forward') => void;
  onContinueLog: (payload: any) => void;
  continueData: any;
  contentCount: number;
}

export const CompleteLogContent: React.FC<CompleteLogContentProps> = ({
  noteItem,
  logDayMap,
  showLogDaysBunch,
  displayDate,
  isLastPage,
  actions,
  continueData,
  onDateBackForward,
  onContinueLog,
  contentCount,
}) => {
  const { showTag, selectedNoteName } = useSelector((state: RootState) => state.person);
  const { setDate, updateNoteItem, continueLog } = actions;

  const prop = noteItem.name ?? noteItem.content.data;

  if (prop !== 'Log' || !logDayMap || !displayDate) return <></>;

  const showTagValue = showTag ?? selectedNoteName ?? 'main';

  const enableAnimationCheck = (tag: string | null, prop: string) => {
    if (tag === prop && tag !== '' && prop !== 'Log') return 'grow';
    if (tag === prop && tag !== '' && prop === 'Log') return 'growb';
    return '';
  };

  const showButton = showTagValue === prop;

  return (
    <div className={enableAnimationCheck(showTagValue, prop)}>
      <div className={`logToggleHeader detailTitleBox dark-hover link-border`}>
        {showTag === 'Log' && prop === 'Log' && contentCount && (
          <LogHeader continueData={continueData} onDateBackForward={onDateBackForward} onContinueLog={onContinueLog} />
        )}
      </div>
      {showLogDaysBunch ? (
        <LogDayList logDayMap={logDayMap} setDate={setDate} />
      ) : (
        <LogItemsList
          logDayMap={logDayMap}
          displayDate={displayDate}
          showButton={showButton}
          isLastPage={isLastPage}
          updateNoteItem={updateNoteItem}
          continueLog={continueLog}
        />
      )}
    </div>
  );
};
