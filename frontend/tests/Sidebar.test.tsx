import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { Sidebar } from '../src/shared/components/organisms/Sidebar';

jest.mock('../src/features/notes/hooks/useNotesQueries', () => ({
  useNoteNames: jest.fn(() => ({ data: ['Note1', 'Note2'] })),
}));

describe('Sidebar', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(<Sidebar prepForNote={jest.fn()} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
