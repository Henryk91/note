import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { BackButton } from '../src/shared/components/atoms/BackButton';

describe('BackButton', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(<BackButton hasPages={true} onBack={jest.fn()} onLogout={jest.fn()} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
