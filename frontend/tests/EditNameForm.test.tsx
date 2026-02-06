import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { EditNameForm } from '../src/features/notes/components/NoteDetail/forms';

describe('EditNameForm', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(<EditNameForm heading="Test Heading" onSubmit={jest.fn()} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
