import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { AppRoutes } from '../src/core/routes/AppRoutes';

jest.mock('../src/core/routes/ProtectedRoutes', () => ({
  ProtectedRoutes: () => <div>ProtectedRoutes</div>,
}));
jest.mock('../src/features/auth/pages/Login/Login', () => () => <div>Login</div>);
jest.mock('../src/features/memento/pages/Memento/Memento', () => () => <div>Memento</div>);
jest.mock('../src/features/pomodoro/pages/Pomodoro/Pomodoro', () => () => <div>Pomodoro</div>);
jest.mock('../src/layouts/MainLayout', () => ({ MainLayout: ({ children }: any) => <div>{children}</div> }));
jest.mock('../src/features/notes/pages/NoteDetailPage/NoteDetailPage', () => () => <div>NoteDetailPage</div>);

describe('AppRoutes', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(
      <AppRoutes
        searchTerm=""
        set={jest.fn()}
        addNewNote={jest.fn()}
        theme="Dark"
        setFilterNote={jest.fn()}
        menuButton={jest.fn()}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
