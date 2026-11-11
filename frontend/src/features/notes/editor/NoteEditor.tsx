import React, { useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import { ItemType, NoteItemType } from '../../../shared/utils/Helpers/types';
import { ItemMutations } from '../edit/itemMutations';
import { newItemId } from '../log/logApi';
import { noteExtensions } from './extensions';
import { Baseline, baselineOf, docToMarkdown, markdownToDoc } from './noteMarkdown';
import './noteEditor.css';

export const AUTOSAVE_MS = 500;

export type NoteEditorHandle = { blur: () => void; focusTitle: () => void; flush: () => void };

type Props = {
  /** The NOTE being edited; undefined for a new note, which is created on its first keystroke. */
  item?: NoteItemType;
  folderId: string;
  mutations: ItemMutations;
  variant: 'phone' | 'desktop';
  /** "10 Nov 2026 at 14:30" line above the note (phone). */
  when?: string;
  autoFocusTitle?: boolean;
  onCreated?: (id: string) => void;
  onFocusChange?: (focused: boolean) => void;
};

const SAFE_LINK = /^(https?:|mailto:)/i;

/**
 * A note, always editable and identical while reading and editing (docs/mockups/notes-phone.html screen 2,
 * desktop.html). The document is the stored Markdown parsed with `marked`'s lexer; it is written back as Markdown,
 * byte-identical for every block the user did not change. Autosaves ~500 ms after typing stops, on blur, when the
 * editor goes away and when the page is hidden. No Save button.
 */
export const NoteEditor = React.forwardRef<NoteEditorHandle, Props>(
  ({ item, folderId, mutations, variant, when, autoFocusTitle, onCreated, onFocusChange }, ref) => {
    const stored = item?.content?.data ?? '';
    const itemRef = useRef<NoteItemType | undefined>(item);
    const lastSaved = useRef(stored);
    const baseline = useRef<Baseline | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mutationsRef = useRef(mutations);
    mutationsRef.current = mutations;
    const onCreatedRef = useRef(onCreated);
    onCreatedRef.current = onCreated;
    const onFocusRef = useRef(onFocusChange);
    onFocusRef.current = onFocusChange;

    const editor = useEditor({
      extensions: [
        ...noteExtensions(),
        Placeholder.configure({
          showOnlyCurrent: false,
          includeChildren: false,
          placeholder: ({ node, editor: ed }) => {
            if (node.type.name === 'title') return 'Title';
            if (node.type.name === 'paragraph' && ed.state.doc.childCount === 2) return 'Start writing';
            return '';
          },
        }),
      ],
      content: markdownToDoc(stored) as any,
      editorProps: {
        attributes: { class: 'note-pm', 'aria-label': 'Note', spellcheck: 'false' },
        handleClick: (_view, _pos, event) => {
          const a = (event.target as HTMLElement | null)?.closest?.('a');
          const href = a?.getAttribute('href') ?? '';
          if (a && SAFE_LINK.test(href)) {
            window.open(href, '_blank', 'noopener,noreferrer');
            return true;
          }
          return false;
        },
      },
      onCreate: ({ editor: ed }) => {
        baseline.current = baselineOf(ed.getJSON() as any);
      },
      onUpdate: () => schedule(),
      onFocus: () => onFocusRef.current?.(true),
      onBlur: () => {
        flush();
        onFocusRef.current?.(false);
      },
    });
    const editorRef = useRef(editor);
    editorRef.current = editor;

    const flush = useCallback(() => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const ed = editorRef.current;
      if (!ed || ed.isDestroyed || !baseline.current) return;
      const md = docToMarkdown(ed.getJSON() as any, baseline.current);
      if (md === lastSaved.current) return;
      lastSaved.current = md;
      const current = itemRef.current;
      if (!current) {
        if (md.trim() === '') return; // an untouched (or emptied) new note is never created
        const id = newItemId(folderId, ItemType.NOTE);
        itemRef.current = { id, parentId: folderId, type: ItemType.NOTE, content: { data: md } } as NoteItemType;
        void mutationsRef.current.create(ItemType.NOTE, md, id);
        onCreatedRef.current?.(id);
        return;
      }
      itemRef.current = { ...current, content: { ...(current.content ?? {}), data: md } } as NoteItemType;
      void mutationsRef.current.updateText(current, md);
    }, [folderId]);

    const schedule = useCallback(() => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_MS);
    }, [flush]);

    // Flush when the editor goes away (navigating mid-edit) and when the page is hidden.
    useEffect(() => {
      const onHide = () => flush();
      window.addEventListener('pagehide', onHide);
      return () => {
        window.removeEventListener('pagehide', onHide);
        flush();
      };
    }, [flush]);

    // The stored note changed elsewhere (another device, undo): reload it unless the user is typing here.
    useEffect(() => {
      itemRef.current = item ?? itemRef.current;
      const ed = editorRef.current;
      if (!ed || ed.isDestroyed || !item) return;
      const next = item.content?.data ?? '';
      if (next === lastSaved.current || ed.isFocused || timer.current) return;
      lastSaved.current = next;
      ed.commands.setContent(markdownToDoc(next) as any, false);
      baseline.current = baselineOf(ed.getJSON() as any);
    }, [item]);

    useEffect(() => {
      if (autoFocusTitle && editor) editor.commands.focus(1);
    }, [autoFocusTitle, editor]);

    useImperativeHandle(ref, () => ({
      blur: () => {
        flush();
        editorRef.current?.commands.blur();
      },
      focusTitle: () => editorRef.current?.commands.focus(1),
      flush,
    }));

    // Tapping blank space in the note (below the last line, the margins) starts editing at the end, like Apple Notes.
    const editAtEnd = (e: React.MouseEvent<HTMLDivElement>) => {
      const ed = editorRef.current;
      if (!ed || (e.target as HTMLElement).closest('.ProseMirror')) return;
      ed.commands.focus('end');
    };

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div className={`note-doc is-${variant}`} data-testid="note-doc" onClick={editAtEnd}>
        {when && <div className="note-when">{when}</div>}
        <EditorContent editor={editor} />
      </div>
    );
  },
);
NoteEditor.displayName = 'NoteEditor';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const two = (n: number) => String(n).padStart(2, '0');

/** "10 Nov 2026 at 14:30" (note screen). */
export const formatNoteWhen = (ts?: string | number | Date | null): string => {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} at ${two(d.getHours())}:${two(d.getMinutes())}`;
};

/** List rows: "14:30" today, "Yesterday", otherwise "05.11.2026". */
export const formatListDate = (ts?: string | number | Date | null, now = Date.now()): string => {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const n = new Date(now);
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, n)) return `${two(d.getHours())}:${two(d.getMinutes())}`;
  const y = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1);
  if (sameDay(d, y)) return 'Yesterday';
  return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`;
};

/** When a note was last changed (old notes have no timestamps). */
export const noteTimestamp = (n: NoteItemType): string | undefined => (n as any).updatedAt ?? (n as any).createdAt ?? undefined;

/** Newest first; notes without timestamps keep their order at the end. */
export const sortNotesNewestFirst = (notes: NoteItemType[]): NoteItemType[] =>
  notes
    .map((n, i) => ({ n, i, t: noteTimestamp(n) ? new Date(noteTimestamp(n)!).getTime() : -Infinity }))
    .sort((a, b) => (b.t === a.t ? a.i - b.i : b.t - a.t))
    .map((x) => x.n);
