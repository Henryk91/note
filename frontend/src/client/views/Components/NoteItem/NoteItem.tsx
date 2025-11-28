import React, { useCallback, useEffect, useState } from 'react';
import { marked } from 'marked';
import { getLogDuration } from '../../Helpers/utils';
import { NoteLabel } from '../../Helpers/types';

marked.setOptions({
  breaks: true,
});

type NoteItemProps = {
  item: NoteLabel | string | null;
  date: string;
  show: boolean;
  prevItem?: string;
  nextItem?: string;
  index: number;
  type: string;
  set: (payload: any) => void;
  Theme: string;
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
  item: string;
  Theme: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
  changeDate: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dateToInputDisplayDate: (date: Date) => string;
};

type DisplayItemBoxProps = {
  item: string;
  Theme: string;
  showEdit: boolean;
  count: number;
  show: boolean;
  onEdit: () => void;
};

type DisplayLogItemBoxProps = {
  item: string;
  show: boolean;
  date: string;
  Theme: string;
  prevItem?: string;
  nextItem?: string;
  cont: (payload: any) => void;
  onEdit: () => void;
};

const getMarkdownText = (input: string) => {
  const rawMarkup = marked(input, { sanitize: false });
  return { __html: rawMarkup };
};

const EditItemBox: React.FC<EditItemBoxProps> = ({
  item,
  Theme,
  onSubmit,
  onClose,
  onDelete,
  changeDate,
  dateToInputDisplayDate,
}) => {
  const themeBack = `${Theme.toLowerCase()}-back`;
  const themeHover = `${Theme.toLowerCase()}-hover`;
  let editText = item;
  const isLog = item.includes('"json":true');
  let editDate;
  let editInputDate;

  if (isLog) {
    const logObj = JSON.parse(item);
    editDate = logObj.date;
    editText = logObj.data;
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
          <textarea
            id="text-date"
            className={`editDateArea ${themeBack}`}
            name="itemDate"
            defaultValue={editDate}
          />
        </>
      )}
      <textarea
        className={`editTextarea ${themeBack}`}
        name="item"
        defaultValue={editText}
      />
      <br />
      <button className={`submit-button ${themeBack} ${themeHover}`} type="submit">
        {' '}
        <i className="fas fa-check" />
      </button>
      <button className={`submit-button ${themeBack} ${themeHover}`} onClick={onClose}>
        <i className="fas fa-times" />
      </button>
      <button className={`submit-button ${themeBack} ${themeHover}`} onClick={onDelete}>
        {' '}
        <i className="far fa-trash-alt" />{' '}
      </button>
      <hr />
      <br />
    </form>
  );
};

const DisplayItemBox: React.FC<DisplayItemBoxProps> = ({
  item,
  Theme,
  showEdit,
  count,
  show,
  onEdit,
}) => {
  const themeBorder = `${Theme.toLowerCase()}-border-thick`;
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
            <div
              className={`${noteItemClass} white-color`}
              dangerouslySetInnerHTML={getMarkdownText(item)}
            />
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
  Theme,
  prevItem,
  nextItem,
  cont,
  onEdit,
}) => {
  const parsedItem = JSON.parse(item);
  let showItem = show;
  const newDate = parsedItem.date.substring(0, parsedItem.date.indexOf('GMT')).trim();
  let selectedDate = date;

  if (selectedDate) {
    selectedDate = `${new Date(selectedDate)}`;
    selectedDate = selectedDate.substring(0, 16);
    if (showItem && !newDate.includes(selectedDate)) {
      showItem = false;
    }
  }
  if (!showItem) return null;

  const themeBack = `${Theme.toLowerCase()}-back`;
  const themeBackHover = `${Theme.toLowerCase()}-hover`;

  const hasBreak = ['Break', 'Pause', 'Lunch'].includes(parsedItem.data)
    ? 'logNoteItem'
    : null;

  const prevData = (prevItem !== null && prevItem !== undefined)? JSON.parse(prevItem).data: null;
  const duration = showItem ? getLogDuration(nextItem, parsedItem) : '';

  return (
    <div className="noteItemBox">
      {showItem && (
        <div>
          <div>
            <span className="flex">
              <span className="noteItem white-color log-noteItem">
                {newDate} {duration}
              </span>
              <button
                className={`editButtons ${themeBack} ${themeBackHover}`}
                onClick={onEdit}
              >
                <i className="fas fa-pen" />
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
              dangerouslySetInnerHTML={getMarkdownText(parsedItem.data)}
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
  Theme,
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
    const target = e.target as typeof e.target & {
      item: { value: string };
      itemDate?: { value: string };
    };
    let update: string | { json: boolean; date: string; data: string } = target.item.value;

    if (target.itemDate) {
      update = {
        json: true,
        date: target.itemDate.value,
        data: target.item.value,
      };
      update = JSON.stringify(update);
    }

    set({
      item: update,
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

  const itemIsString = item && typeof item === 'string';
  const isLog = itemIsString ? item.includes('"json":true') : false;
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
              Theme={Theme}
              onSubmit={submitChange}
              onClose={closeEdit}
              onDelete={deleteItem}
              changeDate={changeDate}
              dateToInputDisplayDate={dateToInputDisplayDate}
            />
          )}
          {noEditingIsLog && itemIsString && (
            <DisplayLogItemBox
              item={item}
              show={show}
              date={date}
              Theme={Theme}
              prevItem={prevItem}
              nextItem={nextItem}
              cont={cont}
              onEdit={() => setEditingItem(true)}
            />
          )}
          {noEditingNoLog && itemIsString && (
            <DisplayItemBox
              item={item}
              Theme={Theme}
              showEdit={showEdit}
              count={count}
              show={show}
              onEdit={setEditState}
            />
          )}
        </div>
    </div>
  );
};

export default NoteItem;
