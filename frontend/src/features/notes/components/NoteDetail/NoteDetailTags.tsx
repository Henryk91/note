import React, { useMemo, useState } from 'react';
import NoteItem from '../NoteItem/NoteItem';
import { FolderList } from './forms';
import { Note } from '../../../../shared/utils/Helpers/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { CompleteLogContent } from './CompleteLogContent';
import { useNoteDateLogic } from '../../hooks/useNoteDateLogic';

interface NoteDetailTagsProps {
  person: Note;
  isLastPage: boolean;
  actions: {
    showHideBox: (prop: string) => void;
    saveShowTag: (tag: string) => void;
    continueLog: (payload: any) => void;
    updateNoteItem: (payload: any) => void;
  };
}

const NoteDetailTags: React.FC<NoteDetailTagsProps> = ({ person, isLastPage, actions }) => {
  const { byId, searchTerm } = useSelector((state: RootState) => state.person);
  const persons = byId;

  const { showHideBox, saveShowTag, continueLog, updateNoteItem } = actions;

  const { displayDate, showLogDaysBunch, totalLogCount, logDayMap, setDate, changeDate, dateBackForward, showLogDays } =
    useNoteDateLogic({ person, persons, searchTerm, saveShowTag });

  // State to track which item is being edited (to hide others)
  const [editingId, setEditingId] = useState<string | null>(null);

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

  return (
    <div className={'detailedBox'}>
      {person?.dataLable?.map((noteItem, i) => {
        const isLink = noteItem.type === 'FOLDER';
        const isNote = noteItem.type === 'NOTE';
        const isLogDirectory = noteItem.name === 'Log';
        const prop = (noteItem as any).heading ?? noteItem.name ?? noteItem?.content?.data ?? 'Unknown';
        const contentCount = isLogDirectory ? totalLogCount : persons?.[noteItem.id]?.dataLable?.length;

        // Determine if this item should be hidden (when another item is being edited)
        const isHidden = editingId !== null && editingId !== noteItem.id;

        return (
          <div
            className={`detailedBox ${isHidden ? 'hidden-noteItemBox' : ''}`}
            key={(noteItem.id || prop) + i}
            style={isHidden ? { display: 'none' } : {}}
          >
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
                onEditStart={() => setEditingId(noteItem.id)}
                onEditEnd={() => setEditingId(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NoteDetailTags;
