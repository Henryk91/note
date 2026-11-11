import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ItemMenu } from '../src/features/notes/edit/ItemMenu';
import { SwipeRow } from '../src/features/notes/edit/SwipeRow';

describe('popups close when the user presses outside', () => {
  test('ItemMenu: opens on click, closes on an outside press and on Esc', () => {
    render(
      <div>
        <ItemMenu label="Options" items={[{ label: 'Delete', onSelect: jest.fn(), danger: true }]} />
        <p>elsewhere</p>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.pointerDown(screen.getByText('elsewhere'));
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('ItemMenu: a press inside the menu does not close it before the choice is made', () => {
    const onSelect = jest.fn();
    render(<ItemMenu label="Options" items={[{ label: 'Copy', onSelect }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'Copy' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('SwipeRow: a revealed Delete hides again when something else is pressed', () => {
    const { container } = render(
      <div>
        <SwipeRow onDelete={jest.fn()}>
          <div>row</div>
        </SwipeRow>
        <p>elsewhere</p>
      </div>,
    );
    const row = container.querySelector('.swipe-row') as Element;
    const content = container.querySelector('.swipe-row-content') as HTMLElement;
    fireEvent.contextMenu(row);
    expect(content.style.transform).toBe('translateX(-88px)');
    fireEvent.pointerDown(screen.getByText('elsewhere'));
    expect(content.style.transform).toBe('translateX(0px)');
  });
});
