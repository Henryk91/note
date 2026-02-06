import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for managing the initial loading state and login check
 */
export const useNotesInitializer = () => {
  const [notesInitialLoad, setNotesInitialLoad] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('notesInitialLoad') === 'true';
    }
    return false;
  });

  const checkLoginState = useCallback(() => {
    if (typeof window !== 'undefined') {
      const loginKey = localStorage.getItem('loginKey');
      if (loginKey === null) {
        setNotesInitialLoad(false);
        sessionStorage.removeItem('notesInitialLoad');
      }
    }
  }, []);

  const markAsInitialized = useCallback(() => {
    setNotesInitialLoad(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('notesInitialLoad', 'true');
    }
  }, []);

  useEffect(() => {
    checkLoginState();
  }, [checkLoginState]);

  const resetInitialization = useCallback(() => {
    setNotesInitialLoad(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('notesInitialLoad');
    }
  }, []);

  return {
    notesInitialLoad,
    setNotesInitialLoad,
    checkLoginState,
    resetInitialization,
    markAsInitialized,
  };
};
