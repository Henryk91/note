import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import SearchBar from '../features/notes/components/SearchBar/SearchBar';
import { useSelector } from 'react-redux';
import { RootState } from '../core/store';

type MainLayoutProps = {
  children: React.ReactNode;
  setFilterNote: (val: any) => void;
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children, setFilterNote }) => {
  const theme = useSelector((state: RootState) => state.theme.value);
  const themeBack = `${theme.toLowerCase()}-back`;

  const location = useLocation();
  const isNoteNames = location.pathname === '/notes/note-names';
  return (
    <>
      <header>
        <SearchBar set={setFilterNote} />
        <nav className="bigScreen" id="links">
          <Link
            style={{ textDecoration: 'none' }}
            className={`dark-hover ${themeBack}`}
            id="menuButton"
            to={isNoteNames ? '/notes/main' : '/notes/note-names'}
          >
            <FontAwesomeIcon icon={faBars} />
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
};
