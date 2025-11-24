import React from 'react';
import { Link } from 'react-router-dom';
import NoteDetail from '../NoteDetail/NoteDetail';
import { Note } from '../../Helpers/types';

export type NoteDetailPageItemProps = {
  searchTerm: string;
  noteNames: string[] | null;
  Theme: string;
  notes: Note[] | null;
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
  noteNames: string[] | null | undefined;
  setNoteTheme: (name: string) => void;
  prepForNote: (name: string) => void;
};

export type ScrollButtonsProps = {
  Theme: string;
  showAddItem: boolean;
  showBackButton: boolean;
  onEditName: () => void;
  onAdd: () => void;
};

export type NoteNamesListProps = {
  names: string[] | null | undefined;
  onSelect: (name: string) => void;
};

export type NoteThemesListProps = {
  names: string[];
  onSelect: (name: string) => void;
};

export type BackButtonProps = {
  Theme: string;
  hasPages: boolean;
  onBack: () => void;
  onLogout: () => void;
};

export const NoteDetailPageItem: React.FC<NoteDetailPageItemProps> = ({
  searchTerm,
  noteNames,
  Theme,
  notes,
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
        noteNames={noteNames}
        Theme={Theme}
        set={set}
        openPage={openPage}
        notes={notes}
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

const NoteNamesList: React.FC<NoteNamesListProps> = ({ names, onSelect }) => (
  <>
    {names?.map((name) => (
      <Link key={name} style={{ textDecoration: 'none' }} to="/notes/main" title="Note List">
        <div className="listNameButton" onClick={() => onSelect(name)}>
          <h3> {name} </h3>
        </div>
      </Link>
    ))}
  </>
);

const NoteThemesList: React.FC<NoteThemesListProps> = ({ names, onSelect }) => (
  <>
    {names.map((name) => (
      <Link key={name} style={{ textDecoration: 'none' }} to="/" title="Note List">
        <div className="listNameButton" onClick={() => onSelect(name)}>
          <h3> {name} Theme </h3>
        </div>
      </Link>
    ))}
  </>
);

export const Sidebar: React.FC<SidebarProps> = ({ noteNames, prepForNote, setNoteTheme }) => (
  <div>
    <br />
    <h3 className="page-content-top1">Note Book Names</h3>
    <NoteNamesList names={noteNames} onSelect={prepForNote} />
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
    <NoteThemesList names={['Red', 'Ocean', 'Green', 'Dark', 'Night']} onSelect={setNoteTheme} />
  </div>
);

export const ScrollButtons: React.FC<ScrollButtonsProps> = ({
  Theme,
  showAddItem,
  showBackButton,
  onEditName,
  onAdd,
}) => {
  const themeBack = `${Theme.toLowerCase()}-back`;
  const themeHover = `${Theme.toLowerCase()}-hover`;

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
      {showBackButton === false ? (
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

export const BackButton: React.FC<BackButtonProps> = ({ Theme, hasPages, onBack, onLogout }) => {
  const themeBack = `${Theme.toLowerCase()}-back`;
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
