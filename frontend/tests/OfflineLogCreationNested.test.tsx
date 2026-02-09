import React, { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useNoteOperations } from '../src/features/notes/hooks/useNoteOperations';
import { notesApi } from '../src/features/notes/api/notesApi';
import personReducer from '../src/features/auth/store/personSlice';
import themeReducer from '../src/core/store/themeSlice';

// Mock the API
jest.mock('../src/features/notes/api/notesApi', () => ({
  notesApi: {
    createNote: jest.fn(),
  },
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
  }),
) as jest.Mock;

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

describe('Offline Log Creation Nested', () => {
  test('Creating a log offline should add it to the Log folder if it exists', async () => {
    const parentId = 'parent-1';
    const logFolderId = 'log-folder-1';

    const logFolder = {
      id: logFolderId,
      name: 'Log',
      heading: 'Log',
      type: 'FOLDER',
      dataLable: [], // Initially empty logs
    };

    const parentNote = {
      id: parentId,
      heading: 'Parent Note',
      name: 'Parent Note',
      dataLable: [logFolder], // Parent assumes it has a Log folder
    };

    const { Wrapper, store } = createTestWrapper({
      person: {
        byId: {
          [parentId]: parentNote,
          [logFolderId]: logFolder,
        },
        pages: [{ params: { id: 'root' } }, { params: { id: parentId } }],
        searchTerm: '',
        selectedNoteName: 'test',
        showAddItem: true,
      },
    });

    (notesApi.createNote as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(
      () =>
        useNoteOperations({
          person: store.getState().person.byId[parentId] as any,
          index: 1,
          openPage: jest.fn(),
        }),
      { wrapper: Wrapper },
    );

    // Verify initial state
    expect(store.getState().person.byId[logFolderId].dataLable).toHaveLength(0);

    // Simulate creating a Log
    await act(async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          number: { value: 'My Nested Log Content' },
          tagType: { value: 'Log' },
          tagTypeText: { value: new Date().toISOString() },
        },
      };
      result.current.submitNewItem(mockEvent);
    });

    // ASSERTION: The new log should be in the Log Folder's dataLable, NOT just the parent's
    const updatedLogFolder = store.getState().person.byId[logFolderId];

    // Expecting this to FAIL currently because code appends to parent, not specifically to Log folder
    expect(updatedLogFolder.dataLable).toHaveLength(1);
    expect(updatedLogFolder.dataLable[0].content.data).toBe('My Nested Log Content');
  });
});
