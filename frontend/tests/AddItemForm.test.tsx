import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { AddItemForm } from '../src/features/notes/components/NoteDetail/forms';

describe('AddItemForm', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(
      <AddItemForm addLabel={[{ name: 'Label1', check: true }]} onSubmit={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
