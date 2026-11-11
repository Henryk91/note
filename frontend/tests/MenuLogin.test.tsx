import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../src/test-utils';
import Login from '../src/features/auth/pages/Login/Login';
import { MenuContent } from '../src/shared/components/organisms/Sidebar';
import * as requests from '../src/shared/utils/Helpers/requests';

jest.mock('../src/features/notes/hooks/useNotesQueries', () => ({
  useNoteNames: jest.fn(() => ({ data: ['Henry', 'Site Track', 'Koorvi'] })),
  useNotesWithChildren: jest.fn(() => ({ data: { notes: {} }, isLoading: false })),
  useUpdateNote: jest.fn(() => ({ mutate: jest.fn() })),
  useCreateNote: jest.fn(() => ({ mutate: jest.fn() })),
  useDeleteNote: jest.fn(() => ({ mutate: jest.fn() })),
}));

describe('login (menu-login.html 2 / 4)', () => {
  test('labelled Email and Password fields, Log in button, "No account? Create one"', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Log in to your notebooks')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create one' })).toBeTruthy();
  });

  test('a failed login shows the error under the fields', () => {
    const spy = jest.spyOn(requests, 'loginRequest').mockImplementation((_u: any, next: any) => next({ error: 'nope' }));
    renderWithProviders(<Login />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Log in' }).closest('form')!);
    expect(screen.getByRole('alert').textContent).toBe("That email and password don't match.");
    spy.mockRestore();
  });

  test('the eye button shows and hides the password', () => {
    renderWithProviders(<Login />);
    const input = screen.getByLabelText('Password') as HTMLInputElement;
    expect(input.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input.type).toBe('password');
  });

  test('"Create one" switches to the sign-up form (feature kept)', () => {
    renderWithProviders(<Login />);
    fireEvent.click(screen.getByRole('button', { name: 'Create one' }));
    expect(screen.getByLabelText('Repeat password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeTruthy();
  });
});

describe('menu (menu-login.html 1 / 3)', () => {
  test('phone: Notebooks (Site Track last, after All / None), Apps, Theme with the current one checked, Log out', () => {
    renderWithProviders(<MenuContent withNotebooks />);
    const labels = [...document.querySelectorAll('.menu-nm')].map((n) => n.textContent);
    expect(labels).toEqual(['Henry', 'Koorvi', 'All', 'None', 'Site Track', 'Notes', 'Memento', 'Pomodoro', 'Recently Deleted', 'Dark', 'Ocean', 'Green', 'Night', 'Red', 'Monokai', 'Log out']);
    expect(screen.getAllByLabelText('Current theme')).toHaveLength(1);
  });

  test('desktop popover: no notebooks (they are in the sidebar)', () => {
    renderWithProviders(<MenuContent withNotebooks={false} />);
    expect(screen.queryByText('Notebooks')).toBeNull();
    expect(screen.getByText('Apps')).toBeTruthy();
    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Log out')).toBeTruthy();
  });
});

describe('search scope', () => {
  // eslint-disable-next-line global-require
  const { searchScope } = require('../src/features/notes/components/SearchBar/SearchResults');
  test('a real notebook limits the search; All / None / nothing search everywhere', () => {
    expect(searchScope('Henry')).toBe('Henry');
    expect(searchScope('All')).toBe('');
    expect(searchScope('None')).toBe('');
    expect(searchScope(null)).toBe('');
  });
});
