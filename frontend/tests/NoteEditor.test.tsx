jest.mock('marked', () => jest.requireActual('../node_modules/marked/lib/marked.umd.js'));
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { NoteEditor, formatListDate, formatNoteWhen, sortNotesNewestFirst } from '../src/features/notes/editor/NoteEditor';
import { phoneNoteTarget } from '../src/features/notes/editor/NoteScreen';
import { folderCountLabel } from '../src/features/notes/layout/BottomToolbar';
import { ItemType, NoteItemType } from '../src/shared/utils/Helpers/types';

const mutations = () => ({
  create: jest.fn(async () => 'id'),
  updateText: jest.fn(async () => undefined),
  rename: jest.fn(),
  remove: jest.fn(),
  restore: jest.fn(),
  move: jest.fn(),
});

const note = (data: string): NoteItemType => ({ id: 'f::NOTE::1', parentId: 'f', type: ItemType.NOTE, content: { data } });

// jsdom has no layout; ProseMirror asks for a few DOM measurements.
beforeAll(() => {
  (document as any).elementFromPoint = () => null;
  Range.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}) }) as DOMRect;
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as any;
});

const editorOf = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  return (screen.getByLabelText('Note') as any).editor;
};

describe('NoteEditor (WYSIWYG, Markdown-backed)', () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ['setTimeout'] as any }));
  afterEach(() => jest.useRealTimers());

  test('renders the first line as the title and the body as rich text (bold stays bold, lists stay lists)', async () => {
    const m = mutations();
    const { container } = render(<NoteEditor item={note('Welcome\n\nWith **bold**:\n\n1. one\n2. two')} folderId="f" mutations={m as any} variant="phone" />);
    await editorOf();
    expect(container.querySelector('h1.note-title')?.textContent).toBe('Welcome');
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.querySelectorAll('ol li')).toHaveLength(2);
  });

  test('autosaves ~500 ms after typing, writing Markdown; an unchanged note is never saved', async () => {
    jest.useRealTimers();
    const m = mutations();
    render(<NoteEditor item={note('General core\n\nWindshield wipers')} folderId="f" mutations={m as any} variant="desktop" />);
    const editor = await editorOf();
    act(() => {
      editor.commands.focus('end');
      editor.commands.blur();
    });
    expect(m.updateText).not.toHaveBeenCalled();
    act(() => {
      editor.commands.insertContentAt(editor.state.doc.content.size - 1, ' and **x**');
    });
    expect(m.updateText).not.toHaveBeenCalled();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });
    expect(m.updateText).toHaveBeenCalledTimes(1);
    expect((m.updateText.mock.calls[0] as any)[1]).toBe('General core\n\nWindshield wipers and \\*\\*x\\*\\*');
  });

  test('a new note is created on the first keystroke only; an untouched one is discarded', async () => {
    jest.useRealTimers();
    const m = mutations();
    const created = jest.fn();
    const { unmount } = render(<NoteEditor folderId="f" mutations={m as any} variant="phone" autoFocusTitle onCreated={created} />);
    const editor = await editorOf();
    act(() => editor.commands.blur());
    expect(m.create).not.toHaveBeenCalled();
    act(() => {
      editor.commands.insertContentAt(1, 'Groceries');
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });
    expect(m.create).toHaveBeenCalledTimes(1);
    expect((m.create.mock.calls[0] as any)[1]).toBe('Groceries');
    expect(created).toHaveBeenCalledWith((m.create.mock.calls[0] as any)[2]);
    unmount();
    // nothing else written for the untouched part
    expect(m.updateText).not.toHaveBeenCalled();
  });

  test('saves on unmount (navigating away mid-edit)', async () => {
    const m = mutations();
    const { unmount } = render(<NoteEditor item={note('Pull ups\n\n3 x 8')} folderId="f" mutations={m as any} variant="phone" />);
    const editor = await editorOf();
    act(() => {
      editor.commands.insertContentAt(editor.state.doc.content.size - 1, ', strict');
    });
    unmount();
    expect(m.updateText).toHaveBeenCalledTimes(1);
    expect((m.updateText.mock.calls[0] as any)[1]).toBe('Pull ups\n\n3 x 8, strict');
  });
});

describe('note list helpers', () => {
  const now = new Date(2026, 10, 10, 14, 30).getTime();
  test('list dates: time today, "Yesterday", otherwise dd.mm.yyyy', () => {
    expect(formatListDate(new Date(2026, 10, 10, 14, 30), now)).toBe('14:30');
    expect(formatListDate(new Date(2026, 10, 9, 18, 3), now)).toBe('Yesterday');
    expect(formatListDate(new Date(2026, 10, 5, 9, 12), now)).toBe('05.11.2026');
    expect(formatListDate(undefined, now)).toBe('');
  });
  test('note screen date line', () => {
    expect(formatNoteWhen(new Date(2026, 10, 10, 14, 30))).toBe('10 Nov 2026 at 14:30');
  });
  test('newest first, notes without timestamps last in their order', () => {
    const a = { id: 'a', updatedAt: '2026-11-05T09:00:00Z' } as any;
    const b = { id: 'b', updatedAt: '2026-11-10T09:00:00Z' } as any;
    const c = { id: 'c' } as any;
    const d = { id: 'd' } as any;
    expect(sortNotesNewestFirst([c, a, d, b]).map((n) => n.id)).toEqual(['b', 'a', 'c', 'd']);
  });
  test('bottom bar count (ui-review N4)', () => {
    expect(folderCountLabel(0, 3)).toBe('3 notes');
    expect(folderCountLabel(2, 3)).toBe('2 folders · 3 notes');
    expect(folderCountLabel(1, 0)).toBe('1 folder');
    expect(folderCountLabel(0, 1)).toBe('1 note');
    expect(folderCountLabel(0, 0)).toBe('0 folders');
  });
  test('phone note URLs', () => {
    expect(phoneNoteTarget('/n/' + encodeURIComponent('f::NOTE::1'), '', 'f')).toBe('f::NOTE::1');
    expect(phoneNoteTarget('/n/f', '?new=1', 'f')).toBe('new');
    expect(phoneNoteTarget('/n/f', '', 'f')).toBeNull();
    expect(phoneNoteTarget('/f/f', '', 'f')).toBeNull();
  });
});
