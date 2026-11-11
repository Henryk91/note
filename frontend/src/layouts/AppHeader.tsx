import { IconBolt, IconChevronLeft, IconMenu2, IconSearch, IconX } from '@tabler/icons-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../core/store';
import { useBreakpoint } from '../features/notes/layout/useBreakpoint';
import { FOCUS_SEARCH_EVENT } from '../features/notes/layout/events';
import { QUICK_LOG_EVENT } from '../features/notes/log/QuickLogSheet';
import { SearchResults, searchScope } from '../features/notes/components/SearchBar/SearchResults';
import { ItemMenu } from '../features/notes/edit/ItemMenu';
import { useHeaderState } from '../shared/header/headerStore';
import { useDismiss } from '../features/notes/edit/useDismiss';
import { MenuPopover } from '../shared/components/organisms/Sidebar';

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
  // Desktop: the hamburger opens the menu as a popover (menu-login.html 3).
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);
  useDismiss(menuOpen, menuRef, () => setMenuOpen(false));
  const wide = bp !== 'mobile';
  // One-line titles (Summary) use a compact bar, like the mockups: 40 px instead of 54 px.
  const compact = !wide && header.kicker !== undefined && header.kicker.trim() === '';
  useEffect(() => {
    if (wide) document.documentElement.style.removeProperty('--header-h');
    else document.documentElement.style.setProperty('--header-h', compact ? '39.6px' : '55px');
  }, [wide, compact]);

  const scope = searchScope(notebook);
  const searchLabel = scope ? `Search ${scope}` : 'Search all notes and logs';
  const searchBox = (
    <div className="hd-search is-open">
      <IconSearch size={"1em"} />
      <input
        id="searchBox"
        aria-label={searchLabel}
        placeholder={searchLabel}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
      />
      <button type="button" aria-label="Close search" onClick={closeSearch}>
        <IconX size={"1em"} />
      </button>
      {query.trim() && <SearchResults query={query} onDone={closeSearch} />}
    </div>
  );

  if (wide) {
    return (
      <header className="app-header is-wide">
        <span className="hd-menu-wrap" ref={menuRef}>
          <button
            id="menuButton"
            type="button"
            className={`hd-icon hd-menu ${menuOpen ? 'is-open' : ''}`}
            aria-label="Menu"
            title="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <IconMenu2 size={20} />
          </button>
          {menuOpen && <MenuPopover onClose={() => setMenuOpen(false)} />}
        </span>
        <span className="hd-name">{notebook}</span>
        <span className="hd-sub">notebook</span>
        <span style={{ flex: 1 }} />
        {searching ? (
          searchBox
        ) : (
          <button type="button" className="hd-search" onClick={() => setSearching(true)} aria-label="Search">
            <IconSearch size={"1em"} /> <span className="hd-search-label">Search</span>&nbsp;&nbsp;<span className="hd-search-key">{MOD}F</span>
          </button>
        )}
        <button type="button" className="hd-log" onClick={() => window.dispatchEvent(new Event(QUICK_LOG_EVENT))}>
          <IconBolt size={"1em"} /> Log&nbsp;&nbsp;{MOD}L
        </button>
      </header>
    );
  }

  if (searching) {
    return <header className="app-header is-phone">{searchBox}</header>;
  }

  return (
    <header className="app-header is-phone">
      {header.close ? (
        <button type="button" className="hd-icon hd-close" aria-label="Close menu" onClick={() => header.close?.()}>
          <IconX size={20} />
        </button>
      ) : header.back ? (
        <button type="button" className="hd-back" onClick={header.back.onClick} aria-label={`Back to ${header.back.label}`}>
          <IconChevronLeft size={"1em"} /> <span className="hd-back-label">{header.back.label}</span>
        </button>
      ) : (
        <Link id="menuButton" to={menuTo} className="hd-icon" aria-label="Menu" title="Menu">
          <IconMenu2 size={20} />
        </Link>
      )}
      {header.layout === 'note' ? (
        <span className="hd-title" />
      ) : header.layout === 'menu' ? (
        <div className="hd-title">
          <div className="hd-main">{header.title}</div>
        </div>
      ) : (
        <div className="hd-title">
          {!compact && <div className="hd-kicker">{header.kicker ?? 'NOTEBOOK'}</div>}
          <div className="hd-main">{header.title ?? notebook}</div>
        </div>
      )}
      <div className="hd-right">
        {header.action && (
          <button type="button" className="hd-icon" aria-label={header.action.ariaLabel} onClick={header.action.onClick}>
            {header.action.icon}
          </button>
        )}
        {header.done ? (
          <button type="button" className="hd-done" onMouseDown={(e) => e.preventDefault()} onClick={() => header.done?.()}>
            Done
          </button>
        ) : header.menu && header.menu.length > 0 ? (
          <ItemMenu label={header.layout === 'note' ? 'Note options' : 'Page options'} items={header.menu} />
        ) : (
          <span style={{ width: 20 }} />
        )}
      </div>
    </header>
  );
};
