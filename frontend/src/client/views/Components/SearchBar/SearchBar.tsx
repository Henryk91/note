import React, { useEffect, useState } from 'react';
import { Note } from '../../Helpers/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';

type SearchBarProps = {
  set: (payload: any) => void;
};

type SearchBarState = {
  showSearch: boolean;
  currentNoteName?: string;
  editName: boolean;
};

const SearchBar: React.FC<SearchBarProps> = ({ set }) => {
  const notes = useSelector((state: RootState) => state.person.notes);
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const selectedNoteName = useSelector((state: RootState) => state.person.selectedNoteName);
  const [state, setState] = useState<SearchBarState>({
    showSearch: false,
    currentNoteName: '',
    editName: false,
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, currentNoteName: selectedNoteName }));
  }, [selectedNoteName]);

  const toggleSearch = () => {
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
    if (userName) localStorage.setItem('user', userName);
    set({
      filteredNotes: nextNotes,
      user: userName,
      searchTerm,
    });
  };

  const themeBack = `${theme}-back`;
  const searching = state.showSearch && !state.editName;

  return (
    <header className={themeBack}>
      {state.showSearch === false && state.editName === false && (
        <div className={themeBack} id="userNameBox" aria-label="User Name" onClick={editNameClick}>
          {' '}
          {selectedNoteName}{' '}
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
        <div className="search-box">
          <input
            className={themeBack}
            id="searchBox"
            aria-label="Search Name"
            onKeyUp={(e) => search(e)}
            type="text"
            placeholder="Search..."
          />
        </div>
      )}

      {searching ? (
        <div className="search-clear" onClick={clearSearch}>
          <i className="fas fa-times" />
        </div>
      ) : (
        <div className="search-clear" onClick={toggleSearch}>
          <i className="fas fa-search" />
        </div>
      )}
    </header>
  );
};

export default SearchBar;
