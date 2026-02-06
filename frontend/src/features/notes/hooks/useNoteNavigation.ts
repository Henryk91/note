import { useCallback, useEffect, useState } from 'react';
import { useNotesLogic } from './useNotesLogic'; // Or pass necessary callbacks as args if decoupling is desired

export const useNoteNavigation = (
  checkLoginState: () => void,
  getLastPageData: (override?: boolean) => void,
  setRedirect: () => void,
) => {
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  const menuButton = useCallback(
    (event: any) => {
      if (document.location.pathname.includes('note-names')) {
        event.preventDefault();
        window.history.back();
        checkLoginState();
        getLastPageData(true);
      }
    },
    [checkLoginState, getLastPageData],
  );

  useEffect(() => {
    setRedirect();
    const handleFocus = () => {
      setRedirect();
      const now = new Date().getTime();
      if (!lastRefresh) {
        setLastRefresh(now);
        return;
      }

      const minTimeout = 1000 * 60 * 5;
      if (lastRefresh + minTimeout < now && lastRefresh) {
        setLastRefresh(now);
        checkLoginState();
        getLastPageData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkLoginState, getLastPageData, lastRefresh, setRedirect]);

  return { menuButton };
};
