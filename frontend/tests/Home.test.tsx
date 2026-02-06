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
          '1': { id: '1', heading: 'Note 1', dataLable: [] },
          '2': { id: '2', heading: 'Note 2', dataLable: [] },
        },
      },
      isLoading: false,
    });
    // Mock state for selectedNoteName if needed, but renderWithProviders uses default state.
    // If Home relies on selectedState, we should pass preloadedState.
    const { asFragment } = renderWithProviders(<Home />, {
      preloadedState: {
        person: {
          selectedNoteName: '1', // Needs careful matching with store type
          // Add other required properties for person slice if '1' is not enough
        } as any, // quick fix for type complexity in test, refine later
      },
    });
    expect(asFragment()).toMatchSnapshot();
  });
});
