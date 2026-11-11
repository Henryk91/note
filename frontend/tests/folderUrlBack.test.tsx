import React, { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { act, renderHook, waitFor } from '@testing-library/react';
import personReducer, { setPages } from '../src/features/auth/store/personSlice';
import themeReducer from '../src/core/store/themeSlice';
import { useFolderUrlSync } from '../src/features/notes/hooks/useFolderUrlSync';

const LOG = 'Koorvi::FOLDER::Track::Log';
const TRACK = 'Koorvi::FOLDER::Track';

// The server's real path for the log (same ids as the URL chain, as for most folders).
jest.mock('../src/shared/utils/Helpers/apiFetch', () => ({
  apiFetch: jest.fn(async () => ({
    ok: true,
    json: async () => [
      { id: 'Koorvi', type: 'FOLDER' },
      { id: 'Koorvi::FOLDER::Track', type: 'FOLDER' },
      { id: 'Koorvi::FOLDER::Track::Log', type: 'FOLDER' },
    ],
  })),
}));

// Bug found while adding "Delete log": after opening a page from a link or a reload, Back moved the page stack but
// left the URL on the page you left (so a reload went back there). The server path confirmed the stack, the stack did
// not change, and the pending target was never cleared.
describe('folder URL sync: Back after opening a page from a link', () => {
  test('the URL follows the stack on the first Back', async () => {
    // Browser history: the hook checks window.location before using the server's path.
    window.history.replaceState(null, '', `/f/${encodeURIComponent(LOG)}`);
    const history = createBrowserHistory();
    const store = configureStore({
      reducer: { theme: themeReducer, person: personReducer } as any,
      preloadedState: {
        theme: { themeLower: 'dark' },
        person: { ...personReducer(undefined, { type: 'init' }), authToken: 'token', selectedNoteName: 'Koorvi', pages: [{ params: { id: 'Koorvi' } }] },
      } as any,
    });
    const Wrapper = ({ children }: PropsWithChildren<{}>) => (
      <Provider store={store}>
        <Router history={history}>{children}</Router>
      </Provider>
    );
    renderHook(() => useFolderUrlSync(), { wrapper: Wrapper });

    await waitFor(() => expect((store.getState() as any).person.pages.map((p: any) => p.params.id)).toEqual(['Koorvi', TRACK, LOG]));
    // Let the server path arrive (it confirms the same stack).
    const { apiFetch } = jest.requireMock('../src/shared/utils/Helpers/apiFetch');
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    await act(async () => {
      for (let i = 0; i < 5; i += 1) await new Promise((r) => setTimeout(r, 0));
    });

    // Back: the stack drops the log page.
    act(() => {
      store.dispatch(setPages([{ params: { id: 'Koorvi' } }, { params: { id: TRACK } }] as any));
    });
    await waitFor(() => expect(decodeURIComponent(history.location.pathname)).toBe(`/f/${TRACK}`));
  });
});
