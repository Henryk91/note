import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { ProtectedRoutes } from '../src/core/routes/ProtectedRoutes';

jest.mock('../src/features/notes/pages/Home/Home', () => () => <div>Home</div>);
jest.mock('../src/features/notes/pages/NoteDetailPage/NoteDetailPage', () => () => <div>NoteDetailPage</div>);
jest.mock('../src/features/notes/pages/NewNote/NewNote', () => () => <div>NewNote</div>);

describe('ProtectedRoutes', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(
      <ProtectedRoutes>
        <div>Child</div>
      </ProtectedRoutes>,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
