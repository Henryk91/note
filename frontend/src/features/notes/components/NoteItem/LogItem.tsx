import React from 'react';
import { NoteContent, NoteItemType } from '../../../../shared/utils/Helpers/types';
import { useNoteItemLogic } from '../../hooks/useNoteItemLogic';
import { EditItemBox, getMarkdownText } from './NoteItem';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { getLogDuration } from '../../../../shared/utils/Helpers/utils';

type LogItemProps = {
  item: NoteItemType;
  date: string;
  show: boolean;
  prevItem?: NoteItemType;
  nextItem?: NoteItemType;
  index: number;
  type: string;
  set: (payload: any) => void;
  cont: (payload: any) => void;
};

type DisplayLogItemBoxProps = {
  item: NoteContent;
  show: boolean;
  date: string;
  prevItem?: NoteItemType;
  nextItem?: NoteItemType;
  cont: (payload: any) => void;
  onEdit: () => void;
};

const DisplayLogItemBox: React.FC<DisplayLogItemBoxProps> = ({
  item,
  show,
  date,
  prevItem,
  nextItem,
  cont,
  onEdit,
}) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);

  if (!show) return null;

  const newDate = item?.date?.substring(0, item?.date.indexOf('GMT')).trim();

  if (date) {
    let selectedDate = `${new Date(date)}`;
    selectedDate = selectedDate.substring(0, 16);
    if (show && !newDate?.includes(selectedDate)) return null;
  }

  const themeBack = `${theme}-back`;
  const themeBackHover = `${theme}-hover`;

  const hasBreak = ['Break', 'Pause', 'Lunch'].includes(item.data);
  const prevData = prevItem?.content?.data;
  const duration = getLogDuration(nextItem, item);

  return (
    <div className="noteItemBox">
      <div>
        <div>
          <span className="flex">
            <span className="noteItem white-color log-noteItem">
              {newDate} {duration}
            </span>
            <button className={`editButtons ${themeBack} ${themeBackHover}`} onClick={onEdit}>
              <FontAwesomeIcon icon={faPen} />
            </button>
            {hasBreak && prevData && (
              <button className={`editButtons ${themeBack} ${themeBackHover}`} onClick={() => cont({ cont: prevData })}>
                Cont
              </button>
            )}
          </span>
          <div
            className={`noteItem ${hasBreak ? 'logNoteItem' : null} dangerous-text`}
            dangerouslySetInnerHTML={getMarkdownText(item.data)}
          />
        </div>
        <hr />
      </div>
    </div>
  );
};

const LogItem: React.FC<LogItemProps> = (props) => {
  const {
    item,
    editingItem,
    setEditState,
    closeEdit,
    submitChange,
    deleteItemHandler,
    changeDate,
    dateToInputDisplayDate,
    dateInputRef,
  } = useNoteItemLogic(props);

  const { show, date, prevItem, nextItem, cont } = props;

  const content = item?.content;
  const editing = editingItem && show;

  if (!content) return <></>;
  if (editing)
    return (
      <div className="noteTagBox">
        <EditItemBox
          item={content}
          onSubmit={submitChange}
          onClose={closeEdit}
          onDelete={deleteItemHandler}
          changeDate={changeDate}
          dateToInputDisplayDate={dateToInputDisplayDate}
          dateInputRef={dateInputRef as any}
        />
      </div>
    );

  return (
    <div className="noteTagBox">
      <DisplayLogItemBox
        item={content}
        show={show}
        date={date}
        prevItem={prevItem}
        nextItem={nextItem}
        cont={cont}
        onEdit={() => setEditState()}
      />
    </div>
  );
};

export default LogItem;
