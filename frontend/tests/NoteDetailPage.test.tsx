import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import NoteDetailPage from '../src/features/notes/pages/NoteDetailPage/NoteDetailPage';
import * as useNotesQueries from '../src/features/notes/hooks/useNotesQueries';

jest.mock('../src/features/notes/hooks/useNotesQueries', () => ({
  // The page now also uses the mutation hooks; keep the real ones and stub only the two reads.
  ...jest.requireActual('../src/features/notes/hooks/useNotesQueries'),
  useNoteNames: jest.fn(),
  useNotesWithChildren: jest.fn(() => ({ data: { notes: {} }, isLoading: false })),
}));

// Swiper ships ES modules only, which Jest (CommonJS) cannot load; the page stack is not what this test checks.
jest.mock('swiper/react', () => {
  const R = jest.requireActual('react');
  return {
    Swiper: ({ children }: { children: React.ReactNode }) => R.createElement('div', { 'data-testid': 'swiper' }, children),
    SwiperSlide: ({ children }: { children: React.ReactNode }) => R.createElement('div', { 'data-testid': 'swiper-slide' }, children),
  };
});
jest.mock('swiper', () => ({}));
jest.mock('swiper/css', () => ({}));

jest.mock('../src/shared/components/organisms/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

jest.mock('../src/features/notes/components/ScrollButtons', () => ({
  ScrollButtons: () => <div data-testid="scroll-buttons">ScrollButtons</div>,
}));

jest.mock('../src/shared/components/atoms/BackButton', () => ({
  BackButton: () => <div data-testid="back-button">BackButton</div>,
}));

describe('NoteDetailPage', () => {
  // Phone width: the stacked pages this test was written for (wider screens get the desktop layout, tested elsewhere).
  const width = window.innerWidth;
  beforeAll(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    // jsdom has no element scrolling; each page scrolls itself to the top when it mounts.
    if (!Element.prototype.scrollTo) Element.prototype.scrollTo = jest.fn();
  });
  afterAll(() => Object.defineProperty(window, 'innerWidth', { configurable: true, value: width }));

  test('matches snapshot', () => {
    (useNotesQueries.useNoteNames as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { asFragment } = renderWithProviders(<NoteDetailPage />);
    expect(asFragment()).toMatchSnapshot();
  });
});
