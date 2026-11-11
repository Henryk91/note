import React, { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { act, renderHook } from '@testing-library/react';
import personReducer from '../src/features/auth/store/personSlice';
import themeReducer from '../src/core/store/themeSlice';
import { useFolderUrlSync } from '../src/features/notes/hooks/useFolderUrlSync';

jest.mock('../src/shared/utils/Helpers/apiFetch', () => ({ apiFetch: jest.fn(async () => ({ ok: true, json: async () => [] })) }));

// A note moved from Koorvi / Todo to the Koorvi root keeps its id `Koorvi::FOLDER::Todo::NOTE::1`. Opening it from the
// root used to rebuild the stack from the id (slide to Todo), then back to the root when the server answered: the
// note's opening motion ran twice.
describe('opening a moved note', () => {
  test('a note listed in the open folder opens there, whatever folder its id names', async () => {
    const NOTE = 'Koorvi::FOLDER::Todo::NOTE::1';
    window.history.replaceState(null, '', '/notes/main');
    const history = createBrowserHistory();
    const store = configureStore({
      reducer: { theme: themeReducer, person: personReducer } as any,
      preloadedState: {
        theme: { themeLower: 'dark' },
        person: {
          ...personReducer(undefined, { type: 'init' }),
          authToken: 'token',
          selectedNoteName: 'Koorvi',
          pages: [{ params: { id: 'Koorvi' } }],
          byId: { Koorvi: { id: 'Koorvi', heading: 'Koorvi', dataLable: [{ id: NOTE, type: 'NOTE', parentId: 'Koorvi' }] } },
        },
      } as any,
    });
    const Wrapper = ({ children }: PropsWithChildren<{}>) => (
      <Provider store={store}>
        <Router history={history}>{children}</Router>
      </Provider>
    );
    renderHook(() => useFolderUrlSync(), { wrapper: Wrapper });
    await act(async () => {
      history.push(`/n/${encodeURIComponent(NOTE)}`);
      await new Promise((r) => setTimeout(r, 0));
    });
    expect((store.getState() as any).person.pages.map((p: any) => p.params.id)).toEqual(['Koorvi']);
    expect(decodeURIComponent(history.location.pathname)).toBe(`/n/${NOTE}`);
  });
});
