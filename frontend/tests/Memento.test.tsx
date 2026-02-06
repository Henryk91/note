import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import Memento from '../src/features/memento/pages/Memento/Memento';

jest.mock('../src/shared/components/atoms/BackButton', () => ({
  BackButton: () => <div data-testid="back-button">BackButton</div>,
}));

describe('Memento', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(<Memento />);
    expect(asFragment()).toMatchSnapshot();
  });
});
