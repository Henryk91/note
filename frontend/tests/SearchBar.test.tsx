import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import SearchBar from '../src/features/notes/components/SearchBar/SearchBar';
import * as useNotesQueries from '../src/features/notes/hooks/useNotesQueries';

jest.mock('../src/features/notes/hooks/useNotesQueries', () => ({
  useNotesWithChildren: jest.fn(),
}));

describe('SearchBar', () => {
  test('matches snapshot', () => {
    (useNotesQueries.useNotesWithChildren as jest.Mock).mockReturnValue({
      data: { notes: [] },
    });

    const { asFragment } = renderWithProviders(<SearchBar set={jest.fn()} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
