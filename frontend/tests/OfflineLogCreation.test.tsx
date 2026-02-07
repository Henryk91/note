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

describe('Offline Log Creation', () => {
  test('Creating a log offline should show it immediately in the list', async () => {
    const parentId = 'parent-1';

    const parentNote = {
      id: parentId,
      heading: 'Parent Note',
      name: 'Parent Note',
      dataLable: [], // Initially empty
    };

    const { Wrapper, store } = createTestWrapper({
      person: {
        byId: {
          [parentId]: parentNote,
        },
        pages: [
          { params: { id: 'root' } }, // index 0
          { params: { id: parentId } }, // index 1 (Current View)
        ],
        searchTerm: '',
        selectedNoteName: 'test',
        showAddItem: true,
      },
    });

    // Mock API to hang (simulate offline/latency)
    (notesApi.createNote as jest.Mock).mockReturnValue(new Promise(() => {}));

    // Use hook at index 1 (Parent View)
    const { result } = renderHook(
      () =>
        useNoteDetailLogic({
          index: 1,
          isLastPage: true,
        }),
      { wrapper: Wrapper },
    );

    // Verify initial state
    expect(store.getState().person.byId[parentId].dataLable).toHaveLength(0);

    // Simulate creating a Log
    await act(async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          number: { value: 'My New Log Content' },
          tagType: { value: 'Log' }, // Tag type Log
          tagTypeText: { value: new Date().toISOString() }, // Date for log
        },
      };
      result.current.submitNewItem(mockEvent);
    });

    // Check optimistic state
    const updatedParent = store.getState().person.byId[parentId];

    // This assertion expects the log to be added to dataLable
    expect(updatedParent.dataLable).toHaveLength(1);
    expect(updatedParent.dataLable[0].content.data).toBe('My New Log Content');
    expect(updatedParent.dataLable[0].type).toBe('LOG');
  });
});
