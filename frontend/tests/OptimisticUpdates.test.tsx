import React, { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useUpdateNote } from '../src/features/notes/hooks/useNotesQueries';
import { notesApi } from '../src/features/notes/api/notesApi';
import personReducer from '../src/features/auth/store/personSlice';
import themeReducer from '../src/core/store/themeSlice';

// Mock the API
jest.mock('../src/features/notes/api/notesApi');

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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );

  return { Wrapper, store };
};

describe('Optimistic Updates', () => {
  test('Update Note: Store updates optimistically before API resolves', async () => {
    const initialNote = { id: 'note-1', heading: 'Old Name', dataLable: [] };
    const { Wrapper, store } = createTestWrapper({
      person: {
        byId: { 'note-1': initialNote },
        pages: [],
        searchTerm: '',
        selectedNoteName: 'test',
      },
    });

    let resolveApi: (val: any) => void;
    (notesApi.updateNote as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveApi = resolve;
      }),
    );

    const { result } = renderHook(() => useUpdateNote(), { wrapper: Wrapper });

    const updatedNote = { ...initialNote, heading: 'New Optimistic Name' };

    await act(async () => {
      result.current.mutate(updatedNote as any);
    });

    // Check state immediately (API is pending)
    const currentHeading = store.getState().person.byId['note-1'].heading;

    // Expect failure initially: it should be 'Old Name' currently
    expect(currentHeading).toBe('New Optimistic Name');

    // Cleanup
    if (resolveApi!) resolveApi({});
  });
});
