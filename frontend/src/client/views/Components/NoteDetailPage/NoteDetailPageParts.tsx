import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowLeft,
  faArrowUp,
  faPen,
  faPlus,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import NoteDetail from '../NoteDetail/NoteDetail';
import { Match, PageDescriptor } from '../../Helpers/types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { setTheme } from '../../../../store/themeSlice';
import { THEMES } from '../../Helpers/const';
import { setEditName, setShowAddItem } from '../../../../store/personSlice';

export type NoteDetailPageItemProps = {
  searchTerm: string;
  pageLink: any;
  showAddItem: boolean;
  index: number;
  editName: boolean;
  lastPage: boolean;
  pageCount: number;
  set: (payload: any) => void;
  openPage: (payload: any) => void;
  initShowtag: PageDescriptor;
  match: Match
}

export type SidebarProps = {
  prepForNote: (name: string) => void;
};

export type ScrollButtonsProps = {
  showBackButton: boolean;
};

export type NoteNamesListProps = {
  onSelect: (name: string) => void;
};

export type NoteThemesListProps = {
  names: string[];
  onSelect: (name: string) => void;
};

export type BackButtonProps = {
  hasPages: boolean;
  onBack: () => void;
  onLogout: () => void;
};

export const NoteDetailPageItem: React.FC<NoteDetailPageItemProps> = ({
  searchTerm,
  pageLink,
  showAddItem,
  index,
  editName,
  lastPage,
  pageCount,
  set,
  openPage,
  initShowtag,
  match,
}) => {

  const key = pageLink?.params?.id ?? 'first';
  return (
    <div id="multiple-pages1" key={key + index}>
      <NoteDetail
        pageCount={pageCount}
        searchTerm={searchTerm}
        set={set}
        openPage={openPage}
        initShowtag={initShowtag}
        index={index}
        showAddItem={showAddItem}
        editName={editName}
        lastPage={lastPage}
        match={match}
      />
    </div>
  );
};

const NoteNamesList: React.FC<NoteNamesListProps> = ({ onSelect }) => {
  const noteNames = useSelector((state: RootState) => state.person.noteNames);
  return (
  <>
    {noteNames?.map((name) => (
      <Link key={name} style={{ textDecoration: 'none' }} to="/notes/main" title="Note List">
        <div className="listNameButton" onClick={() => onSelect(name)}>
          <h3> {name} </h3>
        </div>
      </Link>
    ))}
  </>
)};

const NoteThemesList: React.FC<NoteThemesListProps> = ({ names, onSelect }) => (
  <>
    {names.map((name) => (
      <Link key={name} style={{ textDecoration: 'none' }} to="/notes/main" title="Theme List">
        <div className="listNameButton" onClick={() => onSelect(name)}>
          <h3> {name} Theme </h3>
        </div>
      </Link>
    ))}
  </>
);

export const Sidebar: React.FC<SidebarProps> = ({ prepForNote }) => {
  const dispatch = useDispatch();
  const setSelectedTheme = (name: string) => dispatch(setTheme(name));
  
  return (
  <div>
    <br />
    <h3 className="page-content-top1">Note Book Names</h3>
    <NoteNamesList onSelect={prepForNote} />
    <br />
    <h3>Apps</h3>
    <Link key="memento" style={{ textDecoration: 'none' }} to="/memento" title="Note List">
      <div className="listNameButton">
        <h3> Memento </h3>
      </div>
    </Link>
    <Link key="pomodoro" style={{ textDecoration: 'none' }} to="/pomodoro" title="Note List">
      <div className="listNameButton">
        <h3> Pomodoro </h3>
      </div>
    </Link>
    <br />
    <h3>Themes</h3>
    <NoteThemesList names={THEMES} onSelect={setSelectedTheme} />
  </div>
)}

export const ScrollButtons: React.FC<ScrollButtonsProps> = ({
  showBackButton,
}) => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const { showAddItem, editName} = useSelector((state: RootState) => state.person);
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;

  const addButtonClicked = () => {
    // console.log('addButtonClickedaddButtonClicked');
    dispatch(setShowAddItem(!showAddItem));
    if (!showAddItem) window.scrollTo(0, 0);
  }

  const editNameClick = () => {
      window.scrollTo(0, 0);
      dispatch(setEditName(!editName));
    }

  return (
    <div className="detail-scroll">
      <button  className={`editButtons1 detailUpButton ${themeHover} ${themeBack}`} onClick={editNameClick}>
        <FontAwesomeIcon icon={faPen} />
      </button>
      <div
        className={`detailUpButton ${themeHover} ${themeBack}`}
        onClick={() => {
          window.scrollTo(0, 0);
        }}
      >
        <FontAwesomeIcon icon={faArrowUp} size="lg" />
      </div>
      <div
        className={`detailUpButton ${themeHover} ${themeBack}`}
        onClick={() => {
          window.scrollBy(0, document.body.scrollHeight);
        }}
      >
        <FontAwesomeIcon icon={faArrowDown} size="lg" />
      </div>
      {!showBackButton ? (
        <div className={`detailAddButton ${themeHover} ${themeBack}`}>
          <Link style={{ textDecoration: 'none', color: 'white' }} to="/new-note/">
            <FontAwesomeIcon icon={faPlus}/>
          </Link>
        </div>
      ) : (
        <div
          className={`detailAddButton ${themeHover} ${themeBack}`}
          onClick={() => addButtonClicked()}
        >
          <FontAwesomeIcon icon={faPlus} />
        </div>
      )}
    </div>
  );
};

export const BackButton: React.FC<BackButtonProps> = ({  hasPages, onBack, onLogout }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const icon: IconProp = hasPages ? faArrowLeft : faPowerOff;
  const handleClick = () => {
    if (hasPages) onBack();
    else onLogout();
  };
  return (
    <button className={`backButton ${themeBack}`} onClick={handleClick}>
      <FontAwesomeIcon icon={icon} />
    </button>
  );
};
