import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { useNotesWithChildren, useNoteNames } from './useNotesQueries';
import { useOnlineStatus } from '../../../shared/hooks/useOnlineStatus';
import { useNotesInitializer } from './useNotesInitializer';
import { useRedirectLogic } from './useRedirectLogic';
import { useNotesActions } from './useNotesActions';
import { setSelectedNoteName, setSearchTerm } from '../../auth/store/personSlice';

/**
 * Cleaned up useNotesLogic using decomposed hooks
 */
export const useNotesLogic = () => {
  const dispatch = useDispatch();

  // 1. Initial State & Auth
  const { notesInitialLoad, checkLoginState, markAsInitialized } = useNotesInitializer();
  const loginKey = typeof window !== 'undefined' ? localStorage.getItem('loginKey') : null;
  const isLoggedIn = !!loginKey;

  // 2. Client State (Redux)
  const selectedNoteName = useSelector((state: RootState) => state.person.selectedNoteName);
  const pages = useSelector((state: RootState) => state.person.pages);
  const searchTerm = useSelector((state: RootState) => state.person.searchTerm);
  const isLastPage = Array.isArray(pages) && pages.length > 0 ? pages[pages.length - 1] : undefined;
  const reloadLastPage = useSelector((state: RootState) => state.person.reloadLastPage);

  // 3. Local State
  const isOnline = useOnlineStatus();

  // 4. Data Fetching (TanStack Query)
  const activeParentId = isLastPage?.params.id || selectedNoteName;
  const {
    data: notesData,
    isLoading: loadingData,
    refetch: refetchNotes,
  } = useNotesWithChildren(activeParentId || undefined, isLoggedIn && !!activeParentId);

  // Still fetch noteNames for auto-selection logic
  const { data: noteNamesData, isLoading: loadingNoteNames } = useNoteNames(isLoggedIn);

  // 5. Decomposed Logics
  const { setRedirect } = useRedirectLogic();
  const { noteDetailSet, addNewNote } = useNotesActions(searchTerm);

  // 6. Navigation Helpers
  const getLastPageData = useCallback(
    (override: boolean = false) => {
      if (isLoggedIn && activeParentId) {
        refetchNotes();
      }
    },
    [refetchNotes, isLoggedIn, activeParentId],
  );

  const setFilterNote = useCallback(
    (val: any) => {
      const newNoteName = val.user || val.noteName;
      if (newNoteName) {
        dispatch(setSelectedNoteName(newNoteName));
      }
      dispatch(setSearchTerm(val.searchTerm || ''));
    },
    [dispatch],
  );

  // 7. Effects

  // Auto-select first notebook name on initial load/login
  useEffect(() => {
    if (noteNamesData && isLoggedIn && !selectedNoteName) {
      const hasInitialized = sessionStorage.getItem('notesInitialLoad') === 'true';
      if (!hasInitialized && noteNamesData.length > 0) {
        dispatch(setSelectedNoteName(noteNamesData[0]));
        markAsInitialized();
      }
    }
  }, [noteNamesData, isLoggedIn, selectedNoteName, dispatch, markAsInitialized]);

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && notesInitialLoad) {
      const timer = setTimeout(() => {
        getLastPageData(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, notesInitialLoad, getLastPageData]);

  // Refetch when last page changes
  useEffect(() => {
    if (isLastPage?.params.id && notesInitialLoad) {
      getLastPageData(true);
    }
  }, [isLastPage?.params.id, reloadLastPage, notesInitialLoad, getLastPageData]);

  // Handle root path redirects when data is ready
  useEffect(() => {
    if (notesData) {
      setRedirect();
    }
  }, [notesData, setRedirect]);

  return {
    notes: notesData ? (notesData as any).notes || notesData : null,
    searchTerm,
    loadingData: loadingData || loadingNoteNames,
    noteDetailSet,
    addNewNote,
    setFilterNote,
    checkLoginState,
    getLastPageData,
    setRedirect,
  };
};
