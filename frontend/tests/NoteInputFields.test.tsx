import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { NewNoteField } from '../src/features/notes/components/EditNoteCheck/NoteInputFields';

describe('NoteInputFields', () => {
  test('NewNoteField matches snapshot', () => {
    const { asFragment } = renderWithProviders(<NewNoteField />);
    expect(asFragment()).toMatchSnapshot();
  });
});
