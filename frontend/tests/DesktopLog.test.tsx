import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DaysColumn, DesktopEntryBar, PICK_LOG_DAY_EVENT, setSelectedLogDay } from '../src/features/notes/log/DesktopLog';
import { buildEntries, groupByDay } from '../src/features/notes/log/logModel';

const items = [
  ['2026-11-10T08:40:00', 'Start'],
  ['2026-11-10T09:00:00', 'Standup'],
  ['2026-11-09T09:00:00', 'Weekly Planning'],
  ['2026-11-09T16:37:00', 'Stop'],
  ['2026-06-09T08:01:00', 'Start'],
].map(([date, data], i) => ({ id: `l::LOG::${i}`, parentId: 'l', type: 'LOG', content: { data, date } })) as any;

describe('desktop log: days column', () => {
  const { days, byDay } = groupByDay(buildEntries(items));
  const now = new Date('2026-11-10T14:30:00').getTime();

  test('one row per day with entries, newest first, month captions, worked time and entry count', () => {
    render(<DaysColumn logId="l" path="Track / Log" days={days} byDay={byDay} mode="time-tracker" nowTs={now} />);
    expect(screen.getByText('3 days')).toBeTruthy();
    expect(screen.getByText('November 2026')).toBeTruthy();
    expect(screen.getByText('June 2026')).toBeTruthy();
    const rows = screen.getAllByRole('option');
    expect(rows.map((r) => r.querySelector('.dl-day-date')?.textContent)).toEqual(['Tue, 10 Nov 2026', 'Mon, 9 Nov 2026', 'Tue, 9 Jun 2026']);
    expect(rows[0].querySelector('.dl-day-meta')?.textContent).toBe('Today · 5h 50m · 2 entries');
    expect(rows[1].querySelector('.dl-day-meta')?.textContent).toBe('7h 37m · 2 entries');
  });

  test('tally logs show the entry count only', () => {
    render(<DaysColumn logId="l" path="Break P5" days={days} byDay={byDay} mode="tally" nowTs={now} />);
    expect(screen.getAllByRole('option')[1].querySelector('.dl-day-meta')?.textContent).toBe('2 entries');
  });

  test('clicking a day asks the log page to open it; the open day is highlighted', () => {
    const picked = jest.fn();
    const onPick = (e: Event) => picked((e as CustomEvent).detail);
    window.addEventListener(PICK_LOG_DAY_EVENT, onPick);
    setSelectedLogDay({ logId: 'l', day: '2026-11-09' });
    render(<DaysColumn logId="l" path="Track / Log" days={days} byDay={byDay} mode="time-tracker" nowTs={now} />);
    const rows = screen.getAllByRole('option');
    expect(rows[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.click(rows[2]);
    expect(picked).toHaveBeenCalledWith({ logId: 'l', day: '2026-06-09' });
    window.removeEventListener(PICK_LOG_DAY_EVENT, onPick);
    setSelectedLogDay(null);
  });
});

describe('desktop log: entry bar (always visible)', () => {
  const props = {
    text: '',
    onText: jest.fn(),
    placeholder: 'What are you working on?',
    panel: { date: '10.11.2026', time: '14:30' },
    panelError: null,
    onPanelField: jest.fn(),
    onStep: jest.fn(),
    editing: false,
    onResetOrCancel: jest.fn(),
    onSend: jest.fn(),
    inputRef: React.createRef<HTMLTextAreaElement>(),
  };

  test('new entry: date, time, steppers, Reset to now, Add; Enter adds, Shift+Enter does not', () => {
    render(<DesktopEntryBar {...props} />);
    expect(screen.getByText('New entry at')).toBeTruthy();
    expect((screen.getByLabelText('Date, dd.mm.yyyy') as HTMLInputElement).value).toBe('10.11.2026');
    expect((screen.getByLabelText('Time, 24 hour HH:MM') as HTMLInputElement).value).toBe('14:30');
    fireEvent.click(screen.getByLabelText('One hour earlier'));
    expect(props.onStep).toHaveBeenCalledWith('h', -1);
    fireEvent.keyDown(screen.getByLabelText('Time, 24 hour HH:MM'), { key: 'ArrowUp' });
    expect(props.onStep).toHaveBeenCalledWith('min', 1);
    expect(screen.getByText('Reset to now')).toBeTruthy();
    fireEvent.keyDown(screen.getByLabelText('Log entry text'), { key: 'Enter', shiftKey: true });
    expect(props.onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByLabelText('Log entry text'), { key: 'Enter' });
    expect(props.onSend).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Add/ })).toBeTruthy();
  });

  test('editing: "Editing entry at", "Cancel edit", "Save"; an invalid field blocks saving', () => {
    render(<DesktopEntryBar {...props} editing panelError="Time must be HH:MM (24 h)" />);
    expect(screen.getByText('Editing entry at')).toBeTruthy();
    expect(screen.getByText('Cancel edit')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Time must be HH:MM (24 h)');
    expect((screen.getByRole('button', { name: /Save/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
