import React, { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useCreateNote, useUpdateNote, useDeleteNote } from '../src/features/notes/hooks/useNotesQueries';
import { notesApi } from '../src/features/notes/api/notesApi';
import personReducer from '../src/features/auth/store/personSlice';
import themeReducer from '../src/core/store/themeSlice';

// Mock the API
jest.mock('../src/features/notes/api/notesApi');

// Helper to create wrapper and store
const createTestWrapper = (preloadedState = {}) => {
  const store = configureStore({
    reducer: {
      theme: themeReducer,
      person: personReducer,
    } as any,
    preloadedState,
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: PropsWithChildren<{}>) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );

  return { Wrapper, store };
};

describe('Redux Sync with Mutations', () => {
  test('updates Redux state after creating a note', async () => {
    const { Wrapper, store } = createTestWrapper();

    // Setup mock
    const newNote = { id: 'new-note-1', heading: 'New Note', dataLable: [] };
    (notesApi.createNote as jest.Mock).mockResolvedValue(newNote);

    const { result } = renderHook(() => useCreateNote(), { wrapper: Wrapper });

    // Initial state check
    expect(store.getState().person.byId['new-note-1']).toBeUndefined();

    // Execute mutation
    await act(async () => {
      result.current.mutate({ heading: 'New Note' });
    });

    // Wait for success
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check if Redux state is updated
    expect(store.getState().person.byId['new-note-1']).toEqual(
      expect.objectContaining({
        id: 'new-note-1',
        heading: 'New Note',
      }),
    );
  });

  test('updates Redux state after updating a note', async () => {
    // Pre-populate store
    const initialNote = { id: 'note-1', heading: 'Original Name', dataLable: [] };
    const { Wrapper, store } = createTestWrapper({
      person: {
        byId: { 'note-1': initialNote },
        pages: [],
        searchTerm: '',
        selectedNoteName: 'test',
      },
    });

    const updatedNote = { id: 'note-1', heading: 'Updated Name', dataLable: [] };
    (notesApi.updateNote as jest.Mock).mockResolvedValue(updatedNote);

    const { result } = renderHook(() => useUpdateNote(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(updatedNote as any);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(store.getState().person.byId['note-1']).toEqual(
      expect.objectContaining({
        heading: 'Updated Name',
      }),
    );
  });

  test('updates Redux state after deleting a note', async () => {
    // Pre-populate store
    const initialNote = { id: 'note-to-delete', heading: 'Delete Me', dataLable: [] };
    const { Wrapper, store } = createTestWrapper({
      person: {
        byId: { 'note-to-delete': initialNote },
        pages: [],
        searchTerm: '',
        selectedNoteName: 'test',
      },
    });

    (notesApi.deleteNote as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useDeleteNote(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(initialNote as any);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(store.getState().person.byId['note-to-delete']).toBeUndefined();
  });
});
