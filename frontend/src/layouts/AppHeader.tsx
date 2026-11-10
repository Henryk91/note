import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBolt, faChevronLeft, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../core/store';
import { useBreakpoint } from '../features/notes/layout/useBreakpoint';
import { FOCUS_SEARCH_EVENT } from '../features/notes/layout/events';
import { QUICK_LOG_EVENT } from '../features/notes/log/QuickLogSheet';
import { SearchResults } from '../features/notes/components/SearchBar/SearchResults';
import { ItemMenu } from '../features/notes/edit/ItemMenu';
import { useHeaderState } from '../shared/header/headerStore';

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '');
const MOD = isMac ? '⌘' : 'Ctrl+';

/**
 * The app header, as in the mockups. Wide: menu, notebook name, search box, "Log" button.
 * Phone: menu or back (labelled with the parent), a two-line title, and the page's `...` menu.
 */
export const AppHeader: React.FC = () => {
  const bp = useBreakpoint();
  const { pathname } = useLocation();
  const notebook = useSelector((state: RootState) => state.person.selectedNoteName) ?? '';
  const header = useHeaderState();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const open = () => {
      setSearching(true);
      setTimeout(() => document.getElementById('searchBox')?.focus(), 40);
    };
    window.addEventListener(FOCUS_SEARCH_EVENT, open);
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, open);
  }, []);

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
  };
  const menuTo = pathname === '/notes/note-names' ? '/notes/main' : '/notes/note-names';
  const wide = bp !== 'mobile';

  const searchBox = (
    <div className="hd-search is-open">
      <FontAwesomeIcon icon={faSearch} />
      <input
        id="searchBox"
        aria-label="Search all notes and logs"
        placeholder="Search all notes and logs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
      />
      <button type="button" aria-label="Close search" onClick={closeSearch}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
      {query.trim() && <SearchResults query={query} onDone={closeSearch} />}
    </div>
  );

  if (wide) {
    return (
      <header className="app-header is-wide">
        <Link id="menuButton" to={menuTo} className="hd-icon" aria-label="Menu" title="Menu">
          <FontAwesomeIcon icon={faBars} />
        </Link>
        <span className="hd-name">{notebook}</span>
        <span className="hd-sub">notebook</span>
        <span style={{ flex: 1 }} />
        {searching ? (
          searchBox
        ) : (
          <button type="button" className="hd-search" onClick={() => setSearching(true)} aria-label="Search">
            <FontAwesomeIcon icon={faSearch} /> Search&nbsp;&nbsp;{MOD}F
          </button>
        )}
        <button type="button" className="hd-log" onClick={() => window.dispatchEvent(new Event(QUICK_LOG_EVENT))}>
          <FontAwesomeIcon icon={faBolt} /> Log&nbsp;&nbsp;{MOD}L
        </button>
      </header>
    );
  }

  if (searching) {
    return <header className="app-header is-phone">{searchBox}</header>;
  }

  return (
    <header className="app-header is-phone">
      {header.back ? (
        <button type="button" id="menuButton" className="hd-back" onClick={header.back.onClick} aria-label={`Back to ${header.back.label}`}>
          <FontAwesomeIcon icon={faChevronLeft} /> <span className="hd-back-label">{header.back.label}</span>
        </button>
      ) : (
        <Link id="menuButton" to={menuTo} className="hd-icon" aria-label="Menu" title="Menu">
          <FontAwesomeIcon icon={faBars} />
        </Link>
      )}
      <div className="hd-title">
        <div className="hd-kicker">{header.kicker ?? 'NOTEBOOK'}</div>
        <div className="hd-main">{header.title ?? notebook}</div>
      </div>
      <div className="hd-right">
        {header.action && (
          <button type="button" className="hd-icon" aria-label={header.action.ariaLabel} onClick={header.action.onClick}>
            {header.action.label}
          </button>
        )}
        {header.menu && header.menu.length > 0 ? (
          <ItemMenu label="Page options" items={header.menu} />
        ) : (
          <span style={{ width: 24 }} />
        )}
      </div>
    </header>
  );
};
