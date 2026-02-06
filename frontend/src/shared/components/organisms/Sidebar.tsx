import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setTheme } from '../../../core/store/themeSlice';
import { THEMES } from '../../utils/Helpers/const';
import { RootState } from '../../../core/store';
import { useNoteNames } from '../../../features/notes/hooks/useNotesQueries';
import { useNotesLogic } from '../../../features/notes/hooks/useNotesLogic';

export type SidebarProps = {
};

type NoteNamesListProps = {
};

type NoteThemesListProps = {
  names: string[];
  onSelect: (name: string) => void;
};

const NoteNamesList: React.FC<NoteNamesListProps> = () => {
  const loginKey = localStorage.getItem('loginKey');
  const { data: noteNames } = useNoteNames(!!loginKey);

  const { noteDetailSet } = useNotesLogic();

  // Add 'All' and 'None' options as in useNotesLogic
  const allNames = noteNames ? [...noteNames, 'All', 'None'] : [];

  return (
    <>
      {allNames.map((name) => (
        <Link key={name} style={{ textDecoration: 'none' }} to="/notes/main" title="Note List">
          <div className="listNameButton" onClick={() => noteDetailSet({ noteName: name })}>
            <h3> {name} </h3>
          </div>
        </Link>
      ))}
    </>
  );
};

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

export const Sidebar: React.FC<SidebarProps> = ({}) => {
  const dispatch = useDispatch();
  const setSelectedTheme = (name: string) => dispatch(setTheme(name));

  return (
    <div>
      <br />
      <h3 className="page-content-top1">Note Book Names</h3>
      <NoteNamesList />
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
  );
};
