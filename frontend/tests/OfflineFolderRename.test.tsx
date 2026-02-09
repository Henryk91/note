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
const mockApi = jest.mock('../src/features/notes/api/notesApi');

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
    preloadedState: {
      theme: { themeLower: 'dark' },
      person: preloadedState,
    },
  });

  const queryClient = new QueryClient();

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
      byId: {
        [parentId]: parentNote,
        [folderId]: folderNote,
        [childNoteId]: childNote,
      },
      pages: [
        { params: { id: 'root' } },
        { params: { id: parentId } }, // index 1
        { params: { id: folderId } }, // index 2 (Current View)
      ],
      searchTerm: '',
      selectedNoteName: 'test',
      showTag: 'Old Folder Name',
    });

    // Mock API
    // (notesApi.updateNote as jest.Mock).mockReturnValue(new Promise(() => {}));

    // Use hook at index 2 (Current Folder View)
    const { result } = renderHook(
      () =>
        useNoteOperations({
          person: store.getState().person.byId[folderId] as any,
          index: 2,
          openPage: jest.fn(),
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
      // The hook might re-read state, so we need to ensure it has latest?
      // Actually useNoteOperations selects from store internally for logic,
      // but takes 'person' as prop. In a real app the prop updates on render.
      // Here renderHook doesn't rerender automatically on store update unless we force it.
      // But submitNameChange reads from 'persons' (store) selector for the logic:
      // const persons = useSelector(...)
      // so it should be fine.

      result.current.submitNameChange(mockEvent);
    });

    // Check optimistic state
    const updatedFolder = store.getState().person.byId[folderId];
    expect(updatedFolder.heading).toBe('New Folder Name');

    // CRITICAL ASSERTION: Children should still exist
    expect(updatedFolder.dataLable).toHaveLength(1);
    expect(updatedFolder.dataLable[0].id).toBe(childNoteId);
  });
});
