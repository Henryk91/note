import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../src/test-utils';
import { MoveToSheet } from '../src/features/notes/layout/MoveToSheet';

jest.mock('../src/features/notes/hooks/useNotesQueries', () => ({
  ...jest.requireActual('../src/features/notes/hooks/useNotesQueries'),
  useNotesWithChildren: jest.fn(() => ({ data: undefined })),
}));

const byId = {
  Henry: { id: 'Henry', heading: 'Henry', dataLable: [{ id: 'Henry::FOLDER::A', type: 'FOLDER', name: 'A' }, { id: 'Henry::Log', type: 'FOLDER', name: 'Log' }] },
};

describe('Move to... picker', () => {
  test('is drawn on <body> (not clipped inside the phone page stack) and Log folders cannot be picked', () => {
    const { container } = renderWithProviders(
      <MoveToSheet item={{ id: 'Henry::FOLDER::A::Log', name: 'Log' } as any} notebook="Henry" initiallyOpen={[]} onPick={jest.fn()} onClose={jest.fn()} />,
      { preloadedState: { person: { byId, pages: [{ params: { id: 'Henry' } }] } } as any },
    );
    const sheet = screen.getByRole('dialog', { name: 'Move to' });
    expect(container.contains(sheet)).toBe(false);
    expect(document.body.contains(sheet)).toBe(true);
    const rows = screen.getAllByRole('treeitem');
    expect(rows.find((r) => r.textContent?.trim() === 'Log')?.getAttribute('aria-disabled')).toBe('true');
    expect(rows.find((r) => r.textContent?.trim() === 'A')?.getAttribute('aria-disabled')).toBeNull();
  });
});
