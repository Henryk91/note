import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from './core/store';
import { useOfflineSync } from './shared/hooks/useOfflineSync';
import { useNotesLogic } from './features/notes/hooks/useNotesLogic';
import { AppRoutes } from './core/routes/AppRoutes';

/**
 * AppContent - Inner component that uses hooks requiring QueryClient
 * This must be rendered INSIDE AppProviders
 */
const AppContent: React.FC = () => {
  useOfflineSync();
  const theme = useSelector((state: RootState) => state.theme.value);

  const { loadingData, setFilterNote } = useNotesLogic();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.toLowerCase());
  }, [theme]);

  useEffect(() => {
    const menuBtn = document.getElementById('menuButton');
    if (menuBtn) {
      if (!loadingData) {
        menuBtn.style.color = '#ffffff';
      } else {
        menuBtn.style.color = '#ffa500';
      }
    }

    // Page colours come from the theme variables (shared/styles/themes.css); only the browser chrome colour is set here.
    const bars: Record<string, string> = { Dark: '#0079ae', Ocean: '#35373d', Green: '#103762', Night: '#27343b', Red: '#bb3b00', Monokai: '#1e1f1c' };
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bars[theme] ?? '#0079ae');
  }, [loadingData, theme]);

  return <AppRoutes setFilterNote={setFilterNote} />;
};

export default AppContent;
