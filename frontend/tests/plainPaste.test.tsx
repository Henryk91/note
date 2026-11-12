import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Composer } from '../src/features/notes/log/Composer';
import { looksUrlMangled } from '../src/features/notes/log/plainPaste';

const props = (over: Record<string, any> = {}): Record<string, any> => ({
  text: 'Run ',
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

const paste = (box: HTMLElement, data: Record<string, string>) =>
  fireEvent.paste(box, { clipboardData: { getData: (t: string) => data[t] ?? '' } });

describe('pasting into the log entry box', () => {
  const original = navigator.clipboard;
  afterEach(() => Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true }));

  test('recognises the link form of plain text', () => {
    expect(looksUrlMangled('go:%2029/29%20NoGO:%2017/18')).toBe(true);
    expect(looksUrlMangled('Go: 29/29 NoGO: 17/18')).toBe(false);
    expect(looksUrlMangled('https://example.com/a%20b')).toBe(true);
    expect(looksUrlMangled('DEV-244 fix')).toBe(false);
  });

  test('text that the clipboard also holds as a link is pasted as the plain text', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { readText: () => Promise.resolve('Go: 29/29 NoGO: 17/18') }, configurable: true });
    const p = props();
    render(<Composer {...(p as any)} />);
    const box = screen.getByLabelText('Log entry text') as HTMLTextAreaElement;
    box.setSelectionRange(4, 4);
    paste(box, { 'text/plain': 'go:%2029/29%20NoGO:%2017/18', 'text/uri-list': 'go:%2029/29%20NoGO:%2017/18' });
    await waitFor(() => expect(p.onText).toHaveBeenCalledWith('Run Go: 29/29 NoGO: 17/18'));
  });

  test('without clipboard access the link form is decoded', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const p = props({ text: '' });
    render(<Composer {...(p as any)} />);
    paste(screen.getByLabelText('Log entry text'), { 'text/plain': 'go:%2029/29%20NoGO:%2017/18' });
    await waitFor(() => expect(p.onText).toHaveBeenCalledWith('go: 29/29 NoGO: 17/18'));
  });

  test('a normal paste is left to the browser', () => {
    const p = props();
    render(<Composer {...(p as any)} />);
    const box = screen.getByLabelText('Log entry text');
    const ev = paste(box, { 'text/plain': 'Standup' });
    expect(ev).toBe(true); // not prevented
    expect(p.onText).not.toHaveBeenCalled();
  });
});
