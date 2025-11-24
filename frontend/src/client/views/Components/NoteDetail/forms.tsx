import React from 'react';
import EditNoteCheck from '../EditNoteCheck/EditNoteCheck';
import { Note } from '../../Helpers/types';

export type EditNameFormProps = {
  Theme: string;
  heading: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export type AddItemFormProps = {
  Theme: string;
  showTag: string | null;
  addLable: any;
  notes: Note[] | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export type NoteDetailListItemProps = {
  linkBorder: string;
  showTag: string | null;
  prop: string;
  themeBorder: string;
  isLink: boolean;
  bunch: any[];
  showDateSelector: boolean;
  themeBack: string;
  themeHover: string;
  continueData: any;
  onShowHide: () => void;
  onShowLogDays: () => void;
  onShowLogTag: (tag: string) => void;
  onChangeDate: (e: React.FormEvent<HTMLFormElement> | React.ChangeEvent<HTMLInputElement>) => void;
  onDateBackForward: (e: React.MouseEvent<HTMLButtonElement>, dir: 'back' | 'forward') => void;
  onContinueLog: (payload: any) => void;
};

export const EditNameForm: React.FC<EditNameFormProps> = ({ Theme, heading, onSubmit }) => {
  const themeBack = `${Theme.toLowerCase()}-back`;
  const themeHover = `${Theme.toLowerCase()}-hover`;
  return (
    <form onSubmit={onSubmit}>
      <br />
      <input
        className={`changeNameHeading ${themeHover} ${themeBack}`}
        name="heading"
        type="text"
        defaultValue={heading}
      />
      <br />
      <br />
      <button className={`submit-button ${themeHover} ${themeBack}`} type="submit">
        {' '}
        <i className="fas fa-check" />
      </button>
      <button className={`submit-button ${themeHover} ${themeBack}`} type="submit">
        {' '}
        <i className="fas fa-times" />
      </button>
      <br />
      <br />
    </form>
  );
};

export const AddItemForm: React.FC<AddItemFormProps> = ({
  Theme,
  showTag,
  addLable,
  notes,
  onSubmit,
  onCancel,
}) => {
  const themeBack = `${Theme.toLowerCase()}-back`;
  const themeHover = `${Theme.toLowerCase()}-hover`;
  return (
    <form onSubmit={onSubmit}>
      <EditNoteCheck Theme={Theme} showTag={showTag} lable={addLable} allNotes={notes} />
      <br />
      <button className={`submit-button ${themeHover} ${themeBack}`} type="submit" id="submit-new-note">
        <i className="fas fa-check" />
      </button>

      <button type="reset" className={`submit-button ${themeHover} ${themeBack}`} onClick={onCancel}>
        {' '}
        <i className="fas fa-times" />{' '}
      </button>
      <br />
    </form>
  );
};

export const LogHeader: React.FC<{
  themeBack: string;
  themeHover: string;
  continueData: any;
  onDateBackForward: (e: React.MouseEvent<HTMLButtonElement>, dir: 'back' | 'forward') => void;
  onContinueLog: (payload: any) => void;
}> = ({ themeBack, themeHover, continueData, onDateBackForward, onContinueLog }) => (
  <div>
    <div className="day-forward-back">
      <button className={`forward-back-button ${themeBack} ${themeHover}`} onClick={(event) => onDateBackForward(event, 'back')}>
        <i className="fas fa-arrow-left" />
      </button>
      <button className={`forward-back-button ${themeBack} ${themeHover}`} onClick={(event) => onDateBackForward(event, 'forward')}>
        <i className="fas fa-arrow-right" />
      </button>
    </div>
    <button className={`editButtons continue-button ${themeBack} ${themeHover}`} onClick={() => onContinueLog({ cont: continueData })}>
      Continue Previous Task
    </button>
    <br />
  </div>
);

export const NoteDetailListItem: React.FC<NoteDetailListItemProps> = ({
  linkBorder,
  showTag,
  prop,
  themeBorder,
  isLink,
  bunch,
  showDateSelector,
  themeBack,
  themeHover,
  continueData,
  onShowHide,
  onShowLogDays,
  onShowLogTag,
  onChangeDate,
  onDateBackForward,
  onContinueLog,
}) => {
  const className = showDateSelector ? 'detailLogBoxTitle' : 'detailBoxTitle';
  const dateCounterId = showDateSelector ? 'date-selector-counter' : '';

  return (
    <>
      <div className={`detailTitleBox dark-hover ${linkBorder}`} onClick={onShowHide}>
        <div id={`${dateCounterId}`} className={`listCountBox white-color ${themeBorder}`} onClick={onShowLogDays}>
          <span className="list-count-item"> {isLink ? <i className="fas fa-folder" /> : bunch.length} </span>
        </div>
        <h3 className={`${className} white-color`}>{prop} </h3>
        {showDateSelector && (
          <form className={`${className} dateSelector`} onSubmit={onChangeDate as any}>
            <input id="note-detail-date" onChange={onChangeDate as any} className={themeBack} type="date" name="dateSelector" />
          </form>
        )}
        {showTag === 'Log' && prop === 'Log' && (
          <button className={`detailBoxTitleButton ${themeBack} ${themeHover}`} onClick={() => onShowLogTag('')}>
            Hide
          </button>
        )}
        {showTag !== 'Log' && prop === 'Log' &&(
          <div>
            <button className={`detailBoxTitleButton ${themeBack} ${themeHover}`} onClick={() => onShowLogTag(prop)}>
              Show
            </button>
          </div>
        )}
      </div>
      <div className={`logToggleHeader detailTitleBox dark-hover ${linkBorder}`}>
        {showTag === 'Log' && prop === 'Log' && (
          <LogHeader
            themeBack={themeBack}
            themeHover={themeHover}
            continueData={continueData}
            onDateBackForward={onDateBackForward}
            onContinueLog={onContinueLog}
          />
        )}
      </div>
    </>
  );
};
