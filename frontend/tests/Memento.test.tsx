import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import Memento from '../src/features/memento/pages/Memento/Memento';

jest.mock('../src/shared/components/atoms/BackButton', () => ({
  BackButton: () => <div data-testid="back-button">BackButton</div>,
}));

describe('Memento', () => {
  // The filled week boxes depend on today's date: pin it so the snapshot is the same every day.
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-10T12:00:00'));
  });
  afterEach(() => jest.useRealTimers());

  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(<Memento />);
    expect(asFragment()).toMatchSnapshot();
  });
});
