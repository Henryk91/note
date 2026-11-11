import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NoteBlock, TrailingBlock, AUTOSAVE_MS } from '../src/features/notes/edit/NoteBlock';
import { SwipeRow } from '../src/features/notes/edit/SwipeRow';
import { ItemType } from '../src/shared/utils/Helpers/types';

const mutations = () =>
  ({
    create: jest.fn().mockResolvedValue('id'),
    updateText: jest.fn().mockResolvedValue(undefined),
    rename: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  }) as any;

const item = { id: 'n1', parentId: 'f', type: ItemType.NOTE, content: { data: 'hello **world**' } } as any;

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
});
afterEach(() => jest.useRealTimers());

describe('NoteBlock (edit in place, autosave)', () => {
  test('shows Markdown; tapping turns it into a raw textarea in the same spot; no Save button', () => {
    render(<NoteBlock item={item} mutations={mutations()} onDelete={jest.fn()} />);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();
    fireEvent.click(screen.getByTestId('note-block').querySelector('.note-block-view') as Element);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('hello **world**');
  });

  test('autosaves about 500 ms after typing stops (debounced), once', () => {
    const m = mutations();
    render(<NoteBlock item={item} mutations={m} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByTestId('note-block').querySelector('.note-block-view') as Element);
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: 'hello w' } });
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS - 100));
    fireEvent.change(box, { target: { value: 'hello world!' } });
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS - 1));
    expect(m.updateText).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(2));
    expect(m.updateText).toHaveBeenCalledTimes(1);
    expect(m.updateText).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'hello world!');
  });

  test('saves on blur, and leaves edit mode', () => {
    const m = mutations();
    render(<NoteBlock item={item} mutations={m} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByTestId('note-block').querySelector('.note-block-view') as Element);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'changed' } });
    fireEvent.blur(screen.getByRole('textbox'));
    expect(m.updateText).toHaveBeenCalledWith(expect.anything(), 'changed');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('saves when the block goes away mid-edit (navigating away)', () => {
    const m = mutations();
    const { unmount } = render(<NoteBlock item={item} mutations={m} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByTestId('note-block').querySelector('.note-block-view') as Element);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'typed just now' } });
    unmount();
    expect(m.updateText).toHaveBeenCalledWith(expect.anything(), 'typed just now');
  });

  test('a link in the rendered text does not start editing', () => {
    const linked = { ...item, content: { data: '<a href="https://example.com">x</a>' } };
    render(<NoteBlock item={linked} mutations={mutations()} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByTestId('note-block').querySelector('a') as Element);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('clearing a block removes it (soft delete with Undo handled by onDelete)', () => {
    const onDelete = jest.fn();
    render(<NoteBlock item={item} mutations={mutations()} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('note-block').querySelector('.note-block-view') as Element);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'Empty note removed');
  });

  test('delete is in the menu, never next to a Save button', () => {
    const onDelete = jest.fn();
    render(<NoteBlock item={item} mutations={mutations()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Note actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'Note deleted');
  });

  test('an unsaved draft survives a refresh and is saved', () => {
    localStorage.setItem('note-draft:n1', 'draft from before the refresh');
    const m = mutations();
    render(<NoteBlock item={item} mutations={m} onDelete={jest.fn()} />);
    expect(m.updateText).toHaveBeenCalledWith(expect.anything(), 'draft from before the refresh');
  });
});

describe('TrailingBlock (new text at the end becomes a new block)', () => {
  test('creates the block on the first autosave, then updates it, then resets after blur', () => {
    const m = mutations();
    render(<TrailingBlock folderId="f" mutations={m} />);
    const box = screen.getByLabelText('New note text') as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: 'first words' } });
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS + 1));
    expect(m.create).toHaveBeenCalledTimes(1);
    expect(m.create.mock.calls[0][1]).toBe('first words');
    fireEvent.change(box, { target: { value: 'first words and more' } });
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS + 1));
    expect(m.create).toHaveBeenCalledTimes(1);
    expect(m.updateText).toHaveBeenCalledWith(expect.objectContaining({ id: m.create.mock.calls[0][2] }), 'first words and more');
    fireEvent.blur(box);
    expect(box.value).toBe('');
  });

  test('an empty box creates nothing', () => {
    const m = mutations();
    render(<TrailingBlock folderId="f" mutations={m} />);
    fireEvent.change(screen.getByLabelText('New note text'), { target: { value: '   ' } });
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS + 1));
    expect(m.create).not.toHaveBeenCalled();
  });
});

describe('SwipeRow', () => {
  test('swiping left reveals Delete, tapping it deletes; a short swipe snaps back', () => {
    const onDelete = jest.fn();
    const { container } = render(
      <SwipeRow onDelete={onDelete}>
        <div>row</div>
      </SwipeRow>,
    );
    const row = container.querySelector('.swipe-row') as Element;
    const content = container.querySelector('.swipe-row-content') as HTMLElement;
    fireEvent.touchStart(row, { touches: [{ clientX: 300, clientY: 10 }] });
    fireEvent.touchMove(row, { touches: [{ clientX: 280, clientY: 12 }] });
    fireEvent.touchEnd(row);
    expect(content.style.transform).toBe('translateX(0px)');
    fireEvent.touchStart(row, { touches: [{ clientX: 300, clientY: 10 }] });
    fireEvent.touchMove(row, { touches: [{ clientX: 200, clientY: 12 }] });
    fireEvent.touchEnd(row);
    expect(content.style.transform).toBe('translateX(-88px)');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
