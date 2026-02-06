import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { useNotesWithChildren, useNoteNames } from './useNotesQueries';

/**
 * Hook for handling root path redirects and browser history management
 */
export const useRedirectLogic = () => {
  const selectedNoteName = useSelector((state: RootState) => state.person.selectedNoteName);
  const loginKey = typeof window !== 'undefined' ? localStorage.getItem('loginKey') : null;
  const isLoggedIn = !!loginKey;

  const { data: notesData } = useNotesWithChildren(selectedNoteName || undefined, isLoggedIn && !!selectedNoteName);
  const { data: noteNames } = useNoteNames(isLoggedIn);

  const setRedirect = useCallback(() => {
    const path = window.location.pathname;
    // Redirect to /notes/main if on root path and we have notes or a selected notebook
    if (path === '/' || window.location.href.includes('index.html')) {
      if ((notesData && noteNames) || selectedNoteName) {
        window.history.pushState('', '', './notes/main');
      }
    }
  }, [noteNames, notesData, selectedNoteName]);

  return { setRedirect };
};
