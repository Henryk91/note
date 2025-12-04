import React, { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { marked } from 'marked';
import { getLogDuration } from '../../Helpers/utils';
import { NoteItemType, NoteContent } from '../../Helpers/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';

marked.setOptions({
  breaks: true,
});

type NoteItemProps = {
  item: NoteContent;
  date: string;
  show: boolean;
  prevItem?: string;
  nextItem?: string;
  index: number;
  type: string;
  set: (payload: any) => void;
  showBack?: boolean;
  btnClassName?: string;
  showButtons?: boolean;
  parent?: any;
  showLogButton?: boolean;
  hideButtons?: boolean;
  count: number;
  cont: (payload: any) => void;
};

type EditItemBoxProps = {
  item: NoteContent;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
  changeDate: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dateToInputDisplayDate: (date: Date) => string;
};

type DisplayItemBoxProps = {
  item: string;
  showEdit: boolean;
  count: number;
  show: boolean;
  onEdit: () => void;
};

type DisplayLogItemBoxProps = {
  item: NoteContent;
  show: boolean;
  date: string;
  prevItem: NoteItemType;
  nextItem: NoteItemType;
  cont: (payload: any) => void;
  onEdit: () => void;
};

const getMarkdownText = (input: string) => {
  const rawMarkup = marked(input, { sanitize: false });
  return { __html: rawMarkup };
};

const EditItemBox: React.FC<EditItemBoxProps> = ({
  item,
  onSubmit,
  onClose,
  onDelete,
  changeDate,
  dateToInputDisplayDate,
}) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;
  const editText = item.data;
  const isLog = item?.date;
  let editDate;
  let editInputDate;

  if (isLog) {
    editDate = item.date;
    editInputDate = dateToInputDisplayDate(new Date(editDate));
  }

  return (
    <form onSubmit={onSubmit} className="noteItemEditBox">
      {isLog && (
        <>
          <input
            onChange={changeDate}
            defaultValue={editInputDate}
            className={themeBack}
            type="datetime-local"
            name="dateSelector"
          />
          <textarea id="text-date" className={`editDateArea ${themeBack}`} name="itemDate" defaultValue={editDate} />
        </>
      )}
      <textarea className={`editTextarea ${themeBack}`} name="item" defaultValue={editText} />
      <br />
      <button className={`submit-button ${themeBack} ${themeHover}`} type="submit">
        {' '}
        <FontAwesomeIcon icon={faCheck} />
      </button>
      <button className={`submit-button ${themeBack} ${themeHover}`} onClick={onClose}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <button className={`submit-button ${themeBack} ${themeHover}`} onClick={onDelete}>
        {' '}
        <FontAwesomeIcon icon={faTrashAlt} />{' '}
      </button>
      <hr />
      <br />
    </form>
  );
};

const DisplayItemBox: React.FC<DisplayItemBoxProps> = ({ item, showEdit, count, show, onEdit }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBorder = `${theme}-border-thick`;
  const noteItemClass = count > 0 ? 'noteItemHasCount' : 'noteItem';

  return (
    <div className="noteItemBox" onClick={onEdit}>
      {show && (
        <>
          <div className="logLine">
            {!showEdit && (
              <div className={`listCountBox noteItemCount ${themeBorder}`}>
                {' '}
                <span className="list-count-item">{count}</span>{' '}
              </div>
            )}
            <div className={`${noteItemClass} white-color`} dangerouslySetInnerHTML={getMarkdownText(item)} />
          </div>
          <hr />
        </>
      )}
    </div>
  );
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
  let showItem = show;
  const newDate = item?.date?.substring(0, item?.date.indexOf('GMT')).trim();
  let selectedDate = date;

  if (selectedDate) {
    selectedDate = `${new Date(selectedDate)}`;
    selectedDate = selectedDate.substring(0, 16);
    if (showItem && !newDate?.includes(selectedDate)) {
      showItem = false;
    }
  }
  if (!showItem) return null;

  const themeBack = `${theme}-back`;
  const themeBackHover = `${theme}-hover`;

  const hasBreak = ['Break', 'Pause', 'Lunch'].includes(item.data) ? 'logNoteItem' : null;

  const prevData = prevItem !== null && prevItem !== undefined ? prevItem?.content?.data : null;

  const duration = showItem ? getLogDuration(nextItem, item) : '';

  return (
    <div className="noteItemBox">
      {showItem && (
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
                <button
                  className={`editButtons ${themeBack} ${themeBackHover}`}
                  onClick={() => cont({ cont: prevData })}
                >
                  Cont
                </button>
              )}
            </span>
            <div
              className={`noteItem ${hasBreak} dangerous-text`}
              dangerouslySetInnerHTML={getMarkdownText(item.data)}
            />
          </div>
          <hr />
        </div>
      )}
    </div>
  );
};

const NoteItem: React.FC<NoteItemProps> = ({
  item: initialItem,
  index,
  type,
  set,
  show,
  date,
  prevItem,
  nextItem,
  count,
  cont,
}) => {
  const [item, setItem] = useState(initialItem);
  const [editingItem, setEditingItem] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);

  const showEdit = type !== 'Log Days';

  const addLeadingZero = (number: number) => {
    if (number < 10) return `0${number}`;
    return number;
  };

  const dateToInputDisplayDate = (inputDate: Date) => {
    if (!inputDate || Number.isNaN(inputDate)) return '';
    const minutes = addLeadingZero(inputDate.getMinutes());
    const hours = addLeadingZero(inputDate.getHours());
    return `${inputDate.toISOString().split('T')[0]}T${hours}:${minutes}`;
  };

  const removeHideClass = useCallback(() => {
    const nodes = document.querySelectorAll('.hidden-noteItemBox');
    nodes.forEach((node) => node.classList.remove('hidden-noteItemBox'));
    window.scrollTo({ top: scrollPos });
  }, [scrollPos]);

  const hideLogLines = () => {
    const nodes = document.querySelectorAll('.noteItemBox');
    nodes.forEach((node) => node.classList.add('hidden-noteItemBox'));
  };

  const setEditState = () => {
    setEditingItem(true);
    setScrollPos(window.scrollY);
    hideLogLines();
    window.scrollTo({ top: 0 });
  };

  const closeEdit = useCallback(() => {
    setEditingItem(false);
    removeHideClass();
  }, [removeHideClass]);

  const submitChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as any
    let update: NoteContent = {data: target.item.value};
    if (target.itemDate) {
      update = { data: target.item.value, date: target?.itemDate?.value }
    }

    set({
      item: { data: target.item.value, date: target?.itemDate?.value },
      oldItem: item,
      index,
      type,
      delete: false,
    });
    setEditingItem(false);
    setItem(update);
    removeHideClass();
  };

  const deleteItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (confirm('Are you sure you want to permanently delete this?')) {
      setItem(null);
      setScrollPos(window.scrollY);
      set({
        oldItem: item,
        index,
        type,
        delete: true,
      });
      removeHideClass();
    }
  };

  const changeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const selectedDate = e.target.value;
    const newDate = new Date(selectedDate);
    const textDate = document.getElementById('text-date') as HTMLInputElement;
    if (textDate) textDate.value = `${newDate}`;
  };

  useEffect(() => {
    if (!show && editingItem) {
      setEditingItem(false);
    }
  }, [show, editingItem]);

  const itemIsString = item && typeof item.data === 'string';
  const isLog = !!(item as NoteContent)?.date;
  const editing = editingItem && show;
  const noEditingIsLog = !editing && isLog;
  const noEditingNoLog = !editing && !isLog;

  if (!item) return <></>;

  return (
    <div>
      <div className="noteTagBox">
        {editing && itemIsString && (
          <EditItemBox
            item={item}
            onSubmit={submitChange}
            onClose={closeEdit}
            onDelete={deleteItem}
            changeDate={changeDate}
            dateToInputDisplayDate={dateToInputDisplayDate}
          />
        )}
        {noEditingIsLog && (
          <DisplayLogItemBox
            item={item}
            show={show}
            date={date}
            prevItem={prevItem}
            nextItem={nextItem}
            cont={cont}
            onEdit={() => setEditingItem(true)}
          />
        )}
        {noEditingNoLog && itemIsString && (
          <DisplayItemBox item={item.data} showEdit={showEdit} count={count} show={show} onEdit={setEditState} />
        )}
      </div>
    </div>
  );
};

export default NoteItem;
