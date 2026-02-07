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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );

  return { Wrapper, store };
};

describe('Folder Rename Persistence', () => {
  test('updates parent dataLable when child folder is renamed', async () => {
    const parentId = 'parent-1';
    const childId = 'child-1';

    const parentNote = {
      id: parentId,
      heading: 'Parent',
      dataLable: [{ id: childId, name: 'Old Name', type: 'FOLDER' }],
    };
    const childNote = {
      id: childId,
      heading: 'Old Name',
      name: 'Old Name',
      dataLable: [],
    };

    const { Wrapper, store } = createTestWrapper({
      person: {
        byId: {
          [parentId]: parentNote,
          [childId]: childNote,
        },
        // Simulate navigation stack: Root -> Parent -> Child
        pages: [
          { params: { id: 'root' } },
          { params: { id: parentId } }, // index 1
          { params: { id: childId } }, // index 2
        ],
        showTag: 'Old Name', // Initial showTag matches old name
        selectedNoteName: 'test',
      },
    });

    // Mock update API to return updated child note
    (notesApi.updateNote as jest.Mock).mockResolvedValue({
      ...childNote,
      heading: 'New Name',
      name: 'New Name',
    });

    // Use hook at index 2 (Child)
    const { result } = renderHook(
      () =>
        useNoteDetailLogic({
          index: 2,
          isLastPage: true,
        }),
      { wrapper: Wrapper },
    );

    // Simulate renaming
    await act(async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        target: { heading: { value: 'New Name' } },
        nativeEvent: { submitter: { value: 'save' } },
      };
      result.current.submitNameChange(mockEvent);
    });

    // Wait for mutation to complete and Redux to update
    // We know updateNoteMutation.onSuccess is what triggers the Redux update for parent
    // verify calling api
    expect(notesApi.updateNote).toHaveBeenCalled();

    // Check if Parent's dataLable is updated in Redux
    await waitFor(() => {
      const updatedParent = store.getState().person.byId[parentId];
      const childInParent = updatedParent.dataLable.find((d: any) => d.id === childId);
      expect(childInParent.name).toBe('New Name');
      expect(childInParent.heading).toBe('New Name');

      // Check if Child's own state is updated
      const updatedChild = store.getState().person.byId[childId];
      expect(updatedChild.heading).toBe('New Name');
      expect(updatedChild.name).toBe('New Name');

      // Check if showTag is updated
      expect(store.getState().person.showTag).toBe('New Name');
    });
  });
});
