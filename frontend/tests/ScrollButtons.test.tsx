import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { ScrollButtons } from '../src/features/notes/components/ScrollButtons';

describe('ScrollButtons', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(<ScrollButtons showBackButton={true} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
