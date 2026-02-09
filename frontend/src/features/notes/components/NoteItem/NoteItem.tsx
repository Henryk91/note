import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { marked } from 'marked';
import { NoteItemType, NoteContent } from '../../../../shared/utils/Helpers/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { useNoteItemLogic } from '../../hooks/useNoteItemLogic';

marked.setOptions({
  breaks: true,
});

type NoteItemProps = {
  item: NoteItemType;
  index: number;
  type: string;
  set: (payload: any) => void;
  show: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
};

type EditItemBoxProps = {
  item: NoteContent;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
  changeDate: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dateToInputDisplayDate: (date: Date) => string;
  dateInputRef: React.RefObject<HTMLTextAreaElement>; // changed to TextArea as it matches the element type
};

type DisplayItemBoxProps = {
  item: string;
  count?: number;
  onEdit: () => void;
};

export const getMarkdownText = (input: string) => {
  const rawMarkup = marked(input);
  return { __html: rawMarkup };
};

export const EditItemBox: React.FC<EditItemBoxProps> = ({
  item,
  onSubmit,
  onClose,
  onDelete,
  changeDate,
  dateToInputDisplayDate,
  dateInputRef,
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
          <textarea
            ref={dateInputRef}
            id="text-date"
            className={`editDateArea ${themeBack}`}
            name="itemDate"
            defaultValue={editDate}
          />
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

export const DisplayItemBox: React.FC<DisplayItemBoxProps> = ({ item, count = 0, onEdit }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBorder = `${theme}-border-thick`;

  const markdownClick = (e) => {
    // Clicking on markdown links should not trigger the edit mode
    if (e.target.tagName === 'A') e.stopPropagation();
  };

  return (
    <div className="noteItemBox" onClick={onEdit}>
      <div className="logLine">
        {count > 0 && (
          <div className={`listCountBox noteItemCount ${themeBorder}`}>
            <span className="list-count-item">{count}</span>
          </div>
        )}
        <div
          className={`${count > 0 ? 'noteItemHasCount' : 'noteItem'} white-color`}
          dangerouslySetInnerHTML={getMarkdownText(item)}
          onClick={markdownClick}
        />
      </div>
      <hr />
    </div>
  );
};

const NoteItem: React.FC<NoteItemProps> = (props) => {
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

  const content = item?.content;
  if (!content) return <></>;

  return (
    <div>
      <div className="noteTagBox">
        {editingItem && (
          <EditItemBox
            item={content}
            onSubmit={submitChange}
            onClose={closeEdit}
            onDelete={deleteItemHandler}
            changeDate={changeDate}
            dateToInputDisplayDate={dateToInputDisplayDate}
            dateInputRef={dateInputRef as any}
          />
        )}
        {!editingItem && <DisplayItemBox item={content.data} onEdit={setEditState} />}
      </div>
    </div>
  );
};

export default NoteItem;
