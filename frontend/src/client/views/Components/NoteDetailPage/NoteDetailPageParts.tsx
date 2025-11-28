import React from 'react';
import { Link } from 'react-router-dom';
import NoteDetail from '../NoteDetail/NoteDetail';
import { Note } from '../../Helpers/types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { setTheme } from '../../../../store/themeSlice';
import { THEMES } from '../../Helpers/const';

export type NoteDetailPageItemProps = {
  searchTerm: string;
  pageLink: any;
  showAddItem: boolean;
  index: number;
  editName: boolean;
  lastPage: boolean;
  pageCount: number;
  hideAddItem: () => void;
  set: (payload: any) => void;
  openPage: (payload: any) => void;
  initShowtag?: any;
} & React.ComponentProps<typeof NoteDetail>;

export type SidebarProps = {
  prepForNote: (name: string) => void;
};

export type ScrollButtonsProps = {
  showBackButton: boolean;
  onEditName: () => void;
  onAdd: () => void;
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
  hideAddItem,
  set,
  openPage,
  initShowtag,
  ...rest
}) => {
  const key = pageLink && pageLink.params && pageLink.params.id ? pageLink.params.id : 'first';
  return (
    <div id="multiple-pages1" key={key + index}>
      <NoteDetail
        pageCount={pageCount}
        hideAddItem={hideAddItem}
        searchTerm={searchTerm}
        set={set}
        openPage={openPage}
        initShowtag={initShowtag}
        index={index}
        showAddItem={showAddItem}
        editName={editName}
        lastPage={lastPage}
        {...rest}
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
  onEditName,
  onAdd,
}) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const themeHover = `${theme}-hover`;

  return (
    <div className="detail-scroll">
      <button className={`editButtons1 detailUpButton ${themeHover} ${themeBack}`} onClick={onEditName}>
        <i className="fas fa-pen" />
      </button>
      <div
        className={`detailUpButton ${themeHover} ${themeBack}`}
        onClick={() => {
          window.scrollTo(0, 0);
        }}
      >
        <i className="fas fa-arrow-up" />
      </div>
      <div
        className={`detailUpButton ${themeHover} ${themeBack}`}
        onClick={() => {
          window.scrollBy(0, document.body.scrollHeight);
        }}
      >
        <i className="fas fa-arrow-down" />
      </div>
      {!showBackButton ? (
        <div className={`detailAddButton ${themeHover} ${themeBack}`}>
          <Link style={{ textDecoration: 'none', color: 'white' }} to="/new-note/">
            <i className="fas fa-plus" />
          </Link>
        </div>
      ) : (
        <div
          className={`detailAddButton ${themeHover} ${themeBack}`}
          onClick={() => {
            onAdd();
          }}
        >
          <i className="fas fa-plus" />
        </div>
      )}
    </div>
  );
};

export const BackButton: React.FC<BackButtonProps> = ({  hasPages, onBack, onLogout }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;
  const icon = hasPages ? 'fas fa-arrow-left' : 'fas fa-power-off';
  const handleClick = () => {
    if (hasPages) onBack();
    else onLogout();
  };
  return (
    <button className={`backButton ${themeBack}`} onClick={handleClick}>
      <i className={icon} />
    </button>
  );
};
