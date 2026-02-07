import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import Home from '../src/features/notes/pages/Home/Home';
import * as useNotesQueries from '../src/features/notes/hooks/useNotesQueries';

// Mock the hook
jest.mock('../src/features/notes/hooks/useNotesQueries', () => ({
  useNotesWithChildren: jest.fn(),
}));

describe('Home', () => {
  test('matches snapshot loading', () => {
    (useNotesQueries.useNotesWithChildren as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });
    const { asFragment } = renderWithProviders(<Home />);
    expect(asFragment()).toMatchSnapshot();
  });

  test('matches snapshot with data', () => {
    (useNotesQueries.useNotesWithChildren as jest.Mock).mockReturnValue({
      data: {
        notes: {
          '1': { id: '1', heading: 'Note 1', dataLable: [{ id: '2', name: 'Note 2' }] },
          '2': { id: '2', heading: 'Note 2', dataLable: [] },
        },
      },
      isLoading: false,
    });

    const { asFragment } = renderWithProviders(<Home />, {
      preloadedState: {
        person: {
          selectedNoteName: '1',
          byId: {
            '1': { id: '1', heading: 'Note 1', dataLable: [{ id: '2', name: 'Note 2' }] },
            '2': { id: '2', heading: 'Note 2', dataLable: [] },
          },
        } as any,
      },
    });
    expect(asFragment()).toMatchSnapshot();
  });
});
