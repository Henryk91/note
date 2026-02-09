import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Note } from '../../../../shared/utils/Helpers/types';
import { useSelector } from 'react-redux';

import { RootState } from '../../../../core/store';

type SearchBarProps = {
  set: (payload: any) => void;
};

type SearchBarState = {
  showSearch: boolean;
  currentNoteName?: string;
  editName: boolean;
};

import { useNotesWithChildren } from '../../hooks/useNotesQueries';

const SearchBar: React.FC<SearchBarProps> = ({ set }) => {
  const selectedNoteName = useSelector((state: RootState) => state.person.selectedNoteName);
  const theme = useSelector((state: RootState) => state.theme.themeLower);

  const { data: notesData } = useNotesWithChildren(selectedNoteName || undefined, !!selectedNoteName);
  const notes = notesData ? (Object.values((notesData as any).notes || notesData) as Note[]) : null;

  const [state, setState] = useState<SearchBarState>({
    showSearch: false,
    currentNoteName: '',
    editName: false,
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, currentNoteName: selectedNoteName }));
  }, [selectedNoteName]);

  const toggleSearch = (e) => {
    e.stopPropagation();
    setState((prev) => ({
      ...prev,
      showSearch: !prev.showSearch,
      currentNoteName: prev.currentNoteName ?? '',
    }));
  };

  const toggleEditName = () => {
    setState((prev) => ({ ...prev, editName: !prev.editName }));
  };

  const editNameClick = () => {
    toggleEditName();
    setTimeout(() => {
      document.getElementById('userNameBox')?.focus();
    }, 100);
  };

  const clearSearch = () => {
    set({
      filteredNotes: notes,
      user: state.currentNoteName,
      searchTerm: null,
    });

    setState((prev) => ({ ...prev, showSearch: false }));
  };

  const search = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const searchTerm = !state.editName ? event?.currentTarget?.value || '' : null;
    const editingName = !state.showSearch && state.editName;
    const userName = editingName ? event?.currentTarget?.value || '' : state.currentNoteName;
    let nextNotes = notes;
    if (nextNotes && searchTerm && searchTerm !== '') {
      const term = searchTerm.toLowerCase();
      nextNotes = nextNotes.filter((val) => val.heading.toLowerCase().includes(term));
    }
    set({
      filteredNotes: nextNotes,
      user: userName,
      searchTerm,
    });
  };

  const themeBack = `${theme}-back`;

  return (
    <header className={themeBack}>
      {state.showSearch === false && state.editName === false && (
        <div className={themeBack} id="userNameBox" aria-label="User Name" onClick={editNameClick}>
          <div className="center-text">{selectedNoteName}</div>
          <div className="search-clear" onClick={(e) => toggleSearch(e)}>
            <FontAwesomeIcon icon={faSearch} />
          </div>
        </div>
      )}
      {state.showSearch === false && state.editName === true && (
        <input
          className={themeBack}
          id="userNameBox"
          type="text"
          aria-label="User Name"
          onKeyUp={(e) => search(e)}
          defaultValue={selectedNoteName}
          placeholder="Add Note Name"
          onBlur={toggleEditName}
        />
      )}
      {state.showSearch === true && (
        <div id="userNameBox">
          <input
            className={themeBack}
            id="searchBox"
            aria-label="Search Name"
            onKeyUp={(e) => search(e)}
            type="text"
            placeholder="Search..."
          />
          <div className="search-clear" onClick={clearSearch}>
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </div>
        </div>
      )}
    </header>
  );
};

export default SearchBar;
