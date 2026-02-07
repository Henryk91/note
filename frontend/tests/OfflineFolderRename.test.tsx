import React, { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useNoteDetailLogic } from '../src/features/notes/hooks/useNoteDetailLogic';
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

describe('Offline Folder Rename', () => {
  test('Renaming folder should NOT remove its children from the view', async () => {
    const parentId = 'parent-1';
    const folderId = 'folder-1';
    const childNoteId = 'note-inside-folder-1';

    const parentNote = {
      id: parentId,
      heading: 'Parent',
      dataLable: [{ id: folderId, name: 'Old Folder Name', type: 'FOLDER' }],
    };

    // The folder itself, having one child note
    const folderNote = {
      id: folderId,
      heading: 'Old Folder Name',
      name: 'Old Folder Name',
      dataLable: [{ id: childNoteId, name: 'Child Note', heading: 'Child Note', type: 'NOTE' }],
    };

    const childNote = {
      id: childNoteId,
      heading: 'Child Note',
      dataLable: [],
    };

    const { Wrapper, store } = createTestWrapper({
      person: {
        byId: {
          [parentId]: parentNote,
          [folderId]: folderNote,
          [childNoteId]: childNote,
        },
        // Navigation: Root -> Parent -> Folder
        pages: [
          { params: { id: 'root' } },
          { params: { id: parentId } }, // index 1
          { params: { id: folderId } }, // index 2 (Current View)
        ],
        searchTerm: '',
        selectedNoteName: 'test',
        showTag: 'Old Folder Name',
      },
    });

    // Mock API to hang (simulate offline/latency) so we verify optimistic state
    (notesApi.updateNote as jest.Mock).mockReturnValue(new Promise(() => {}));

    // Use hook at index 2 (Current Folder View)
    const { result } = renderHook(
      () =>
        useNoteDetailLogic({
          index: 2,
          isLastPage: true,
        }),
      { wrapper: Wrapper },
    );

    // Verify initial state: Children exist
    expect(store.getState().person.byId[folderId].dataLable).toHaveLength(1);

    // Update name
    await act(async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        target: { heading: { value: 'New Folder Name' } },
        nativeEvent: { submitter: { value: 'save' } },
      };
      result.current.submitNameChange(mockEvent);
    });

    // Check optimistic state
    const updatedFolder = store.getState().person.byId[folderId];
    expect(updatedFolder.heading).toBe('New Folder Name');

    // CRITICAL ASSERTION: Children should still exist
    // This is expected to FAIL currently because dataLable is being reset to []
    expect(updatedFolder.dataLable).toHaveLength(1);
    expect(updatedFolder.dataLable[0].id).toBe(childNoteId);
  });
});
