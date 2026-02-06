import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import SearchBar from '../features/notes/components/SearchBar/SearchBar';
import { useSelector } from 'react-redux';
import { RootState } from '../core/store';

type MainLayoutProps = {
  children: React.ReactNode;
  setFilterNote: (val: any) => void;
  menuButton: (e: any) => void;
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children, setFilterNote, menuButton }) => {
  const theme = useSelector((state: RootState) => state.theme.value);
  const themeBack = `${theme.toLowerCase()}-back`;
  return (
    <>
      <header>
        <SearchBar set={setFilterNote} />
        <nav className="bigScreen" id="links">
          <Link
            style={{ textDecoration: 'none' }}
            className={`dark-hover ${themeBack}`}
            onClick={menuButton}
            id="menuButton"
            to="/notes/note-names"
          >
            <FontAwesomeIcon icon={faBars} />
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
};
