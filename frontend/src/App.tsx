import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './core/store';
import { setTheme } from './core/store/themeSlice';
import { useOfflineSync } from './shared/hooks/useOfflineSync';
import { useNotesLogic } from './features/notes/hooks/useNotesLogic';
import { useNoteNavigation } from './features/notes/hooks/useNoteNavigation';
import { AppRoutes } from './core/routes/AppRoutes';

/**
 * AppContent - Inner component that uses hooks requiring QueryClient
 * This must be rendered INSIDE AppProviders
 */
const AppContent: React.FC = () => {
  useOfflineSync();
  const theme = useSelector((state: RootState) => state.theme.value);

  const { loadingData, noteDetailSet, setFilterNote, checkLoginState, getLastPageData, setRedirect } =
    useNotesLogic();

  const { menuButton } = useNoteNavigation(checkLoginState, getLastPageData, setRedirect);

  useEffect(() => {
    const menuBtn = document.getElementById('menuButton');
    if (menuBtn) {
      if (!loadingData) {
        menuBtn.style.color = '#ffffff';
      } else {
        menuBtn.style.color = '#ffa500';
      }
    }

    if (theme === 'Green') {
      document.body.style.backgroundColor = '#103762';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#103762');
    }
    if (theme === 'Red') {
      document.body.style.backgroundColor = '#030303';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#d00000');
    }
    if (theme === 'Ocean') {
      document.body.style.backgroundColor = '#35373D';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#38cdb8');
    }
    if (theme === 'Dark') {
      document.body.style.backgroundColor = '#061f2f';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0090c8');
    }
    if (theme === 'Night') {
      document.body.style.backgroundColor = '#061f2f';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#27343b');
    }
  }, [loadingData, theme]);

  return (
    <AppRoutes
      setFilterNote={setFilterNote}
      menuButton={menuButton}
    />
  );
};

export default AppContent;
