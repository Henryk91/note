import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScrollJump, jumpDirection } from '../src/shared/components/ScrollJump';

describe('jump to top / bottom on long lists', () => {
  test('only lists with more than 25 items get the button', () => {
    const { rerender } = render(<ScrollJump count={25} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<ScrollJump count={26} />);
    expect(screen.getByRole('button', { name: 'Scroll to the bottom' })).toBeTruthy();
  });

  test('down in the top half of the list, up past the middle', () => {
    expect(jumpDirection(0, 3000, 600)).toBe('down');
    expect(jumpDirection(1100, 3000, 600)).toBe('down');
    expect(jumpDirection(1300, 3000, 600)).toBe('up');
    expect(jumpDirection(2400, 3000, 600)).toBe('up');
  });
});
