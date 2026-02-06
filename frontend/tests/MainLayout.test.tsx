import React from 'react';
import { renderWithProviders } from '../src/test-utils';
import { MainLayout } from '../src/layouts/MainLayout';

describe('MainLayout', () => {
  test('matches snapshot', () => {
    const { asFragment } = renderWithProviders(
      <MainLayout setFilterNote={() => {}} menuButton={() => {}}>
        <div data-testid="child">Child Content</div>
      </MainLayout>,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
