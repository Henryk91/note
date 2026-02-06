import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import AppContent from '../src/App';

// Mock child components
jest.mock('../src/core/routes/AppRoutes', () => ({
  AppRoutes: () => <div data-testid="app-routes">AppRoutes</div>,
}));
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

// Mock hooks
jest.mock('../src/shared/hooks/useOfflineSync', () => ({
  useOfflineSync: jest.fn(),
}));

jest.mock('../src/features/notes/hooks/useNotesLogic', () => ({
  useNotesLogic: jest.fn(() => ({
    notes: [],
    searchTerm: '',
    loadingData: false,
    noteDetailSet: jest.fn(),
    addNewNote: jest.fn(),
    setFilterNote: jest.fn(),
    checkLoginState: jest.fn(),
    getLastPageData: jest.fn(),
    setRedirect: jest.fn(),
  })),
}));

jest.mock('../src/features/notes/hooks/useNoteNavigation', () => ({
  useNoteNavigation: jest.fn(() => ({
    menuButton: jest.fn(),
  })),
}));

test('App matches snapshot', () => {
  const { asFragment } = renderWithProviders(<AppContent />);
  expect(asFragment()).toMatchSnapshot();
});
