import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../src/test-utils';
import { DesktopSidebar } from '../src/features/notes/layout/DesktopSidebar';

jest.mock('../src/features/notes/hooks/useNotesQueries', () => ({
  useNoteNames: jest.fn(() => ({ data: ['Henry', 'Koorvi', 'Site Track'] })),
  useNotesWithChildren: jest.fn(() => ({ data: { notes: {} }, isLoading: false })),
}));
jest.mock('../src/features/notes/log/QuickLogSheet', () => ({ usePinnedLogs: jest.fn(() => ({ data: [] })) }));
jest.mock('../src/features/notes/layout/FolderTree', () => ({ FolderTree: () => null }));

const props = {
  notebook: 'Koorvi',
  folderId: 'Koorvi',
  expandedIds: new Set<string>(),
  onToggle: jest.fn(),
  onSelectFolder: jest.fn(),
  onSelectNotebook: jest.fn(),
  onOpenLog: jest.fn(),
  onDropItem: jest.fn(),
};
const notebookRows = () => [...document.querySelectorAll('.side-section:first-child .side-item')].map((b) => b.textContent);

describe('desktop sidebar: collapsible notebooks', () => {
  beforeEach(() => localStorage.clear());

  test('collapsing keeps only the open notebook, expanding shows all; the choice is remembered', () => {
    const { unmount } = renderWithProviders(<DesktopSidebar {...props} />);
    expect(notebookRows()).toEqual(['Henry', 'Koorvi']);
    const toggle = screen.getByRole('button', { name: /Notebooks/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle);
    expect(notebookRows()).toEqual(['Koorvi']);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    unmount();
    renderWithProviders(<DesktopSidebar {...props} />);
    expect(notebookRows()).toEqual(['Koorvi']);
    fireEvent.click(screen.getByRole('button', { name: /Notebooks/ }));
    expect(notebookRows()).toEqual(['Henry', 'Koorvi']);
  });
});
