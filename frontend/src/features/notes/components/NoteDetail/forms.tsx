import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faCheck, faFolder, faTimes, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import EditNoteCheck from '../EditNoteCheck/EditNoteCheck';
import { Note } from '../../../../shared/utils/Helpers/types';
import { RootState } from '../../../../core/store';
import { useSelector } from 'react-redux';

export type EditNameFormProps = {
  heading: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export type AddItemFormProps = {
  addLabel: any;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export type FolderListProps = {
  linkBorder: string;
  prop: string;
  contentCount: number;
  onShowHide: () => void;
  onShowLogDays: () => void;
  onShowLogTag: (tag: string) => void;
  onChangeDate: (e: React.FormEvent<HTMLFormElement> | React.ChangeEvent<HTMLInputElement>) => void;
};

export const EditNameForm: React.FC<EditNameFormProps> = ({ heading, onSubmit }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;
  return (
    <form onSubmit={onSubmit}>
      <br />
      <input
        autoFocus
        className={`changeNameHeading ${themeHover} ${themeBack}`}
        name="heading"
        type="text"
        defaultValue={heading}
      />
      <br />
      <br />
      <button className={`submit-button ${themeHover} ${themeBack}`} type="submit">
        {' '}
        <FontAwesomeIcon icon={faCheck} />
      </button>
      <button className={`submit-button ${themeHover} ${themeBack}`} type="submit">
        {' '}
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <button value="delete" className={`submit-button ${themeBack} ${themeHover}`} type="submit">
        <FontAwesomeIcon icon={faTrashAlt} />
      </button>
      <br />
      <br />
    </form>
  );
};

export const AddItemForm: React.FC<AddItemFormProps> = ({ addLabel, onSubmit, onCancel }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;
  return (
    <div className="add-item-comp">
      <form onSubmit={onSubmit}>
        <EditNoteCheck lable={addLabel} />
        <br />
        <button className={`submit-button ${themeHover} ${themeBack}`} type="submit" id="submit-new-note">
          <FontAwesomeIcon icon={faCheck} />
        </button>

        <button type="reset" className={`submit-button ${themeHover} ${themeBack}`} onClick={onCancel}>
          {' '}
          <FontAwesomeIcon icon={faTimes} />{' '}
        </button>
        <br />
      </form>
    </div>
  );
};

export const LogHeader: React.FC<{
  continueData: any;
  onDateBackForward: (e: React.MouseEvent<HTMLButtonElement>, dir: 'back' | 'forward') => void;
  onContinueLog: (payload: any) => void;
}> = ({ continueData, onDateBackForward, onContinueLog }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;

  return (
    <div>
      <div className="day-forward-back">
        <button
          className={`forward-back-button ${themeBack} ${themeHover}`}
          onClick={(event) => onDateBackForward(event, 'back')}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <button
          className={`forward-back-button ${themeBack} ${themeHover}`}
          onClick={(event) => onDateBackForward(event, 'forward')}
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
      <button
        className={`editButtons continue-button ${themeBack} ${themeHover}`}
        onClick={() => onContinueLog({ cont: continueData })}
      >
        Continue Previous Task
      </button>
      <br />
    </div>
  );
};

export const FolderList: React.FC<FolderListProps> = ({
  linkBorder,
  prop,
  contentCount,
  onShowHide,
  onShowLogDays,
  onShowLogTag,
  onChangeDate,
}) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const showTag = useSelector((state: RootState) => state.person.showTag);
  const themeBack = `${theme}-back`;
  const themeBorder = `${theme}-border-thick`;
  const themeHover = `${theme}-hover`;

  const propIsLog = prop === 'Log';
  if (propIsLog && contentCount === 0) return <></>;

  const className = propIsLog ? 'detailLogBoxTitle' : 'detailBoxTitle';
  const dateCounterId = propIsLog ? 'date-selector-counter' : '';

  return (
    <>
      <div className={`detailTitleBox dark-hover ${linkBorder}`} onClick={onShowHide}>
        <div id={`${dateCounterId}`} className={`listCountBox white-color ${themeBorder}`} onClick={onShowLogDays}>
          <span className="list-count-folder">
            <FontAwesomeIcon icon={faFolder} className="list-count-folder-icon" />
            <span className="list-count-folder-number">{contentCount}</span>
          </span>
        </div>
        <h3 className={`${className} white-color`}>{prop || '<NAME NOT SET>'} </h3>
        {propIsLog && contentCount > 0 && (
          <>
            <form className={`${className} dateSelector`} onSubmit={onChangeDate as any}>
              <input
                id="note-detail-date"
                onChange={onChangeDate as any}
                className={themeBack}
                type="date"
                name="dateSelector"
              />
            </form>
            <div>
              <button
                className={`detailBoxTitleButton ${themeBack} ${themeHover}`}
                onClick={() => onShowLogTag(showTag === 'Log' ? '' : prop)}
              >
                {showTag === 'Log' ? 'Hide' : 'Show'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};
