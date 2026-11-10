import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../src/test-utils';
import { LogRow } from '../src/features/notes/log/LogRow';
import { buildEntries } from '../src/features/notes/log/logModel';
import { ItemType } from '../src/shared/utils/Helpers/types';

const mk = (rows: Array<[string, string, string]>) =>
  buildEntries(
    rows.map(([id, data, date]) => ({ id, type: ItemType.LOG, parentId: 'p', content: { data, date } })) as any,
  );

const baseProps = (entries: ReturnType<typeof mk>, index: number, over: Record<string, unknown> = {}) => ({
  entry: entries[index],
  index,
  dayEntries: entries,
  nowTs: new Date('2026-11-10T20:00:00+01:00').getTime(),
  expandByDefault: false,
  isEditing: false,
  pending: false,
  showContinue: true,
  onEdit: jest.fn(),
  onContinue: jest.fn(),
  onCopy: jest.fn(),
  onLogAgain: jest.fn(),
  onDelete: jest.fn(),
  ...over,
});

describe('LogRow', () => {
  const entries = mk([
    ['1', 'DEV-244 Migrate database', '2026-11-10T09:00:00+01:00'],
    ['2', 'Break ', '2026-11-10T10:00:00+01:00'],
    ['3', 'break', '2026-11-10T10:15:00+01:00'],
  ]);

  test('Continue button also appears for "Break " (trailing space) and "break" (case)', () => {
    const p1 = baseProps(entries, 1);
    renderWithProviders(<LogRow {...(p1 as any)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue DEV-244' }));
    expect(p1.onContinue).toHaveBeenCalledWith('DEV-244 Migrate database');
  });

  test('no Continue button on normal rows or when continuing is disabled', () => {
    renderWithProviders(<LogRow {...(baseProps(entries, 0) as any)} />);
    expect(screen.queryByRole('button', { name: /^Continue/ })).toBeNull();
  });

  test('tapping the time or the text starts editing, a link does not', () => {
    const linked = mk([['1', 'see <a href="https://example.com">docs</a>', '2026-11-10T09:00:00+01:00']]);
    const props = baseProps(linked, 0);
    const { container } = renderWithProviders(<LogRow {...(props as any)} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit entry at/ }));
    expect(props.onEdit).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelector('.log-text') as Element);
    expect(props.onEdit).toHaveBeenCalledTimes(2);
    fireEvent.click(container.querySelector('a') as Element);
    expect(props.onEdit).toHaveBeenCalledTimes(2);
  });

  test('a 20-line entry keeps all its text and collapses behind Show more', () => {
    const text = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n');
    const long = mk([['1', text, '2026-11-10T09:00:00+01:00']]);
    const { container } = renderWithProviders(<LogRow {...(baseProps(long, 0) as any)} />);
    const body = container.querySelector('.log-text') as HTMLElement;
    expect(body.textContent).toContain('line 20');
    expect(body.className).toContain('is-clamped');
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(body.className).not.toContain('is-clamped');
    expect(screen.getByRole('button', { name: 'Show less' })).toBeTruthy();
  });

  test('journal mode expands long entries by default', () => {
    const long = mk([['1', Array.from({ length: 12 }, (_, i) => `l${i}`).join('\n'), '2026-11-10T09:00:00+01:00']]);
    const { container } = renderWithProviders(<LogRow {...(baseProps(long, 0, { expandByDefault: true }) as any)} />);
    expect((container.querySelector('.log-text') as HTMLElement).className).not.toContain('is-clamped');
  });

  test('the menu offers Copy, Log again now and Delete; Delete key deletes a focused row', () => {
    const props = baseProps(entries, 0);
    const { container } = renderWithProviders(<LogRow {...(props as any)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Entry actions' }));
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Log again now' })).toBeTruthy();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(container.querySelector('.log-row') as Element, { key: 'Delete' });
    expect(props.onDelete).toHaveBeenCalledTimes(2);
  });

  test('shows the pending-sync clock and the duration to the next entry', () => {
    renderWithProviders(<LogRow {...(baseProps(entries, 0, { pending: true }) as any)} />);
    expect(screen.getByLabelText('Waiting to sync')).toBeTruthy();
    expect(screen.getByText('1h 0m')).toBeTruthy();
  });
});
