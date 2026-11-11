import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Composer } from '../src/features/notes/log/Composer';

const props = (over: Record<string, any> = {}): Record<string, any> => ({
  text: 'hello',
  onText: jest.fn(),
  placeholder: 'New entry',
  chipLabel: 'Tue 10 Nov 2026, 14:00',
  panelOpen: false,
  onTogglePanel: jest.fn(),
  panel: { date: '10.11.2026', time: '14:00' },
  panelError: null,
  onPanelField: jest.fn(),
  onStep: jest.fn(),
  editing: false,
  onResetOrCancel: jest.fn(),
  onSend: jest.fn(),
  showInput: true,
  inputRef: React.createRef<HTMLTextAreaElement>(),
  ...over,
});

describe('Composer', () => {
  test('Enter sends, Shift+Enter does not, Cmd/Ctrl+Enter always sends (desktop)', () => {
    const p = props();
    render(<Composer {...(p as any)} />);
    const box = screen.getByLabelText('Log entry text');
    fireEvent.keyDown(box, { key: 'Enter', shiftKey: true });
    expect(p.onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(p.onSend).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true });
    expect(p.onSend).toHaveBeenCalledTimes(2);
  });

  test('on touch devices the return key makes a new line and only the button sends', () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('coarse'), media: q })) as any;
    const p = props();
    render(<Composer {...(p as any)} />);
    fireEvent.keyDown(screen.getByLabelText('Log entry text'), { key: 'Enter' });
    expect(p.onSend).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }));
    expect(p.onSend).toHaveBeenCalledTimes(1);
    window.matchMedia = original;
  });

  test('the chip always shows the exact date and time and toggles the panel', () => {
    const p = props();
    render(<Composer {...(p as any)} />);
    expect(screen.getByTestId('time-chip').textContent).toBe('Tue 10 Nov 2026, 14:00');
    fireEvent.click(screen.getByRole('button', { name: 'Entry date and time' }));
    expect(p.onTogglePanel).toHaveBeenCalled();
  });

  test('panel: fields, three steppers, Reset to now, no Done button, validation message', () => {
    const p = props({ panelOpen: true, panelError: 'Time must be HH:MM (24 h)' });
    render(<Composer {...(p as any)} />);
    expect(screen.getByLabelText('Entry date')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Entry time'), { target: { value: '09:15' } });
    expect(p.onPanelField).toHaveBeenCalledWith('time', '09:15');
    fireEvent.click(screen.getByRole('button', { name: 'One day earlier' }));
    fireEvent.click(screen.getByRole('button', { name: 'One hour later' }));
    fireEvent.click(screen.getByRole('button', { name: 'One minute earlier' }));
    expect(p.onStep.mock.calls).toEqual([['d', -1], ['h', 1], ['min', -1]]);
    fireEvent.keyDown(screen.getByLabelText('Entry time'), { key: 'ArrowUp' });
    expect(p.onStep).toHaveBeenLastCalledWith('min', 1);
    expect(screen.getByRole('button', { name: 'Reset to now' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /done/i })).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('HH:MM');
  });

  test('editing: title, Cancel edit and a tick (Save entry) replace Reset to now and send', () => {
    const p = props({ panelOpen: true, editing: true });
    render(<Composer {...(p as any)} />);
    expect(screen.getByText('Editing entry')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel edit' }));
    expect(p.onResetOrCancel).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save entry' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add entry' })).toBeNull();
  });

  test('no quick chips row (ui-review L6: not in the mockup); a tally log hides the box until "Other text..."', () => {
    const p = props({ quickChips: ['Break', 'DEV-1 work'], showInput: false });
    render(<Composer {...(p as any)} />);
    expect(screen.queryByRole('button', { name: 'Break' })).toBeNull();
    expect(screen.queryByLabelText('Log entry text')).toBeNull();
    expect(screen.getByRole('button', { name: 'Other text...' })).toBeTruthy();
  });
  test('tapping send or a tally button keeps the focus (and the phone keyboard) in the box', () => {
    const p = props({ tallyCodes: ['P'], onTally: jest.fn() });
    render(<Composer {...(p as any)} />);
    const box = screen.getByLabelText('Log entry text') as HTMLTextAreaElement;
    box.focus();
    const send = screen.getByRole('button', { name: 'Add entry' });
    expect(fireEvent.mouseDown(send)).toBe(false); // default prevented: no blur
    fireEvent.click(send);
    expect(p.onSend).toHaveBeenCalledTimes(1);
    expect(fireEvent.mouseDown(screen.getByRole('button', { name: 'Log P' }))).toBe(false);
    box.blur();
    expect(fireEvent.mouseDown(send)).toBe(true); // box not focused: normal behaviour
  });

  test('while editing an entry the panel offers Delete next to Cancel edit (not when adding)', () => {
    const p = props({ panelOpen: true, editing: true, onDeleteEditing: jest.fn() });
    const { rerender } = render(<Composer {...(p as any)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(p.onDeleteEditing).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Cancel edit' })).toBeTruthy();
    rerender(<Composer {...(props({ panelOpen: true, editing: false, onDeleteEditing: jest.fn() }) as any)} />);
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });
});
