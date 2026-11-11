import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { lastUsedLabel, suggestEntries } from '../src/features/notes/log/suggest';
import { Composer } from '../src/features/notes/log/Composer';

const NOW = new Date(2026, 10, 11, 12, 0).getTime();
const day = (d: number, h = 9) => new Date(2026, 10, d, h, 0).getTime();
const entries = [
  { text: 'Standup', ts: day(3) },
  { text: 'Standup', ts: day(4) },
  { text: 'Standup', ts: day(10) },
  { text: 'DEV-244 Fix login', ts: day(9) },
  { text: 'Start', ts: day(10, 8) },
  { text: 'Break ', ts: day(9, 11) },
  { text: 'break', ts: day(10, 11) },
  { text: 'Stop', ts: day(1) },
  { text: 'Review PR for start page\nwith notes', ts: day(2) },
];

describe('log entry suggestions', () => {
  test('start of the entry first, then by use (often and recent)', () => {
    expect(suggestEntries(entries, 'st', 5, NOW).map((s) => s.text)).toEqual(['Standup', 'Start', 'Stop', 'Review PR for start page']);
  });

  test('a word start matches ("244" finds DEV-244), first line only', () => {
    const [s] = suggestEntries(entries, '244', 5, NOW);
    expect(s.text).toBe('DEV-244 Fix login');
    expect(s.match).toEqual([4, 7]);
  });

  test('"Break" and "Break " are one suggestion with the latest spelling and both uses counted', () => {
    const [s] = suggestEntries(entries, 'bre', 5, NOW);
    expect(s).toMatchObject({ text: 'break', count: 2, lastTs: day(10, 11) });
  });

  test('nothing for an empty box, multi-line text, or text that already is an entry', () => {
    expect(suggestEntries(entries, '  ', 5, NOW)).toEqual([]);
    expect(suggestEntries(entries, 'st\nx', 5, NOW)).toEqual([]);
    expect(suggestEntries(entries, 'standup', 5, NOW)).toEqual([]);
  });

  test('last used label', () => {
    expect(lastUsedLabel(day(11, 8), NOW)).toBe('today');
    expect(lastUsedLabel(day(10), NOW)).toBe('yesterday');
    expect(lastUsedLabel(day(8), NOW)).toBe('3 d ago');
    expect(lastUsedLabel(day(1), NOW)).toBe('1 Nov');
  });
});

const props = (over: Record<string, any> = {}): Record<string, any> => ({
  text: 'st',
  onText: jest.fn(),
  placeholder: 'New entry',
  chipLabel: 'Wed 11 Nov 2026, 12:00',
  panelOpen: false,
  onTogglePanel: jest.fn(),
  panel: { date: '11.11.2026', time: '12:00' },
  panelError: null,
  onPanelField: jest.fn(),
  onStep: jest.fn(),
  editing: false,
  onResetOrCancel: jest.fn(),
  onSend: jest.fn(),
  showInput: true,
  inputRef: React.createRef<HTMLTextAreaElement>(),
  suggestions: suggestEntries(entries, 'st', 5, NOW),
  onSuggest: jest.fn(),
  ...over,
});

describe('suggestion list in the entry box', () => {
  test('shows the matches; ↓ then Enter takes the highlighted one instead of sending', () => {
    const p = props();
    render(<Composer {...(p as any)} />);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      expect.stringContaining('Standup'),
      expect.stringContaining('Start'),
      expect.stringContaining('Stop'),
      expect.stringContaining('Review PR for start page'),
    ]);
    const box = screen.getByLabelText('Log entry text');
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(p.onSuggest).toHaveBeenCalledWith('Start');
    expect(p.onSend).not.toHaveBeenCalled();
  });

  test('Enter with nothing highlighted still sends; Tab takes the first; a tap takes that row', () => {
    const p = props();
    render(<Composer {...(p as any)} />);
    const box = screen.getByLabelText('Log entry text');
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(p.onSend).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(box, { key: 'Tab' });
    expect(p.onSuggest).toHaveBeenLastCalledWith('Standup');
    fireEvent.click(screen.getAllByRole('option')[2]);
    expect(p.onSuggest).toHaveBeenLastCalledWith('Stop');
  });

  test('Esc closes the list', () => {
    render(<Composer {...(props() as any)} />);
    fireEvent.keyDown(screen.getByLabelText('Log entry text'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
