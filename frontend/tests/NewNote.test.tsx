import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import NewNote from '../src/features/notes/pages/NewNote/NewNote';

jest.mock('../src/features/notes/components/EditNoteCheck/NoteInputFields', () => ({
  NewNoteField: () => <div>NewNoteField</div>,
}));

describe('NewNote', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(<NewNote />);
    expect(asFragment()).toMatchSnapshot();
  });
});
