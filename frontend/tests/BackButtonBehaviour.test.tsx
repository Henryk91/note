import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../src/test-utils';
import { BackButton } from '../src/shared/components/atoms/BackButton';
import personReducer from '../src/features/auth/store/personSlice';

const stateWithPages = (ids: string[]) => ({
  person: {
    ...personReducer(undefined, { type: 'init' }),
    pages: ids.map((id) => ({ params: { id, tempId: id } })),
  },
});

describe('BackButton', () => {
  test('is never a logout button: renders nothing at the notebook root', () => {
    renderWithProviders(<BackButton />, { preloadedState: stateWithPages(['Henry']) });
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('renders a labelled back button inside a folder', () => {
    renderWithProviders(<BackButton />, { preloadedState: stateWithPages(['Henry', 'Henry::FOLDER::Train']) });
    expect(screen.getByRole('button', { name: /^Back/ })).toBeTruthy();
  });

  test('toPath makes it always visible for pages outside the folder stack', () => {
    renderWithProviders(<BackButton toPath="/notes/main" />, { preloadedState: stateWithPages(['Henry']) });
    expect(screen.getByRole('button', { name: /^Back/ })).toBeTruthy();
  });
});
