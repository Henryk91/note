import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { getMarkdownText } from '../../../shared/utils/markdown';
import { NoteItemType } from '../../../shared/utils/Helpers/types';
import { usePendingEntries } from '../log/logApi';
import { ItemMutations } from './itemMutations';
import { ItemMenu } from './ItemMenu';

export const AUTOSAVE_MS = 500;

/** A note's title is its first non-empty line without Markdown heading marks; the body is the rest. */
const firstIndex = (text: string) => text.split('\n').findIndex((l) => l.trim() !== '');
export const noteTitle = (text: string): string => {
  const lines = text.split('\n');
  const i = firstIndex(text);
  return i < 0 ? '' : lines[i].replace(/^#+\s*/, '').trim();
};
export const noteBody = (text: string): string => {
  const lines = text.split('\n');
  const i = firstIndex(text);
  return i < 0 ? '' : lines.slice(i + 1).join('\n').replace(/^\n+/, '');
};
/** One-line preview: the first line of the body (Markdown marks removed). */
export const notePreview = (text: string): string =>
  noteBody(text)
    .split('\n')
    .map((l) => l.replace(/^[#>*\-\d.\s]+/, '').replace(/[*_`]/g, '').trim())
    .find(Boolean) ?? '';

const draftKey = (id: string) => `note-draft:${id}`;
const readDraft = (id: string): string | null => {
  try {
    return localStorage.getItem(draftKey(id));
  } catch {
    return null;
  }
};
const writeDraft = (id: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(draftKey(id));
    else localStorage.setItem(draftKey(id), value);
  } catch {
    /* storage unavailable */
  }
};

type NoteBlockProps = {
  item: NoteItemType;
  /** Wide editor: the first line is the note's title. */
  asDocument?: boolean;
  /** Changing this number puts the block into edit mode ("type anywhere to edit"). */
  editToken?: number;
  hideMenu?: boolean;
  mutations: ItemMutations;
  onDelete: (item: NoteItemType, label?: string) => void;
};

/**
 * One NOTE block of a note. It shows rendered Markdown; tapping it turns it into its raw Markdown in a growing
 * textarea in the same spot. There is no Save button: the text is saved ~500 ms after typing stops, on blur, and
 * when the block goes away (navigating mid-edit). An unsaved draft also survives a refresh.
 */
export const NoteBlock: React.FC<NoteBlockProps> = ({ item, mutations, onDelete, asDocument, editToken, hideMenu }) => {
  const stored = item.content?.data ?? '';
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(stored);
  const textRef = useRef(text);
  const itemRef = useRef(item);
  const lastSaved = useRef(stored);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const pending = usePendingEntries().has(item.id);
  textRef.current = text;
  itemRef.current = item;

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const value = textRef.current;
    if (value !== lastSaved.current) {
      lastSaved.current = value;
      void mutations.updateText(itemRef.current, value);
    }
    writeDraft(itemRef.current.id, null);
  }, [mutations]);

  // Recover a draft that was not saved before a refresh or crash.
  useEffect(() => {
    const draft = readDraft(item.id);
    if (draft !== null && draft !== stored) {
      setText(draft);
      textRef.current = draft;
      setEditing(true);
      flush();
    } else if (draft !== null) {
      writeDraft(item.id, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editToken) setEditing(true);
  }, [editToken]);

  // Show what the server / cache says while not editing.
  useEffect(() => {
    if (!editing) {
      setText(stored);
      lastSaved.current = stored;
    }
  }, [stored, editing]);

  // Navigating away mid-edit saves, and so does hiding the app.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  useEffect(() => {
    const el = areaRef.current;
    if (!editing || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text, editing]);

  useEffect(() => {
    if (editing && areaRef.current) {
      const el = areaRef.current;
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    textRef.current = value;
    writeDraft(item.id, value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_MS);
  };

  const onBlur = () => {
    flush();
    setEditing(false);
    if (textRef.current.trim() === '') onDelete(itemRef.current, 'Empty note removed');
  };

  const onDisplayClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) return; // links stay clickable
    if (window.getSelection()?.toString()) return;
    setEditing(true);
  };

  return (
    <div className="note-block swiper-no-swiping" data-testid="note-block">
      {editing ? (
        <textarea
          ref={areaRef}
          className="note-block-area"
          aria-label="Note text"
          value={text}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Escape' && (e.target as HTMLTextAreaElement).blur()}
        />
      ) : (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="note-block-view white-color" onClick={onDisplayClick}>
          {asDocument && text.trim() && <div className="doc-title">{noteTitle(text)}</div>}
          <div
            // Sanitised Markdown: marked with breaks, then DOMPurify.
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={
              text.trim()
                ? getMarkdownText(asDocument ? noteBody(text) : text)
                : { __html: '<span class="note-block-empty">Empty note</span>' }
            }
          />
        </div>
      )}
      {!hideMenu && <div className="note-block-side">
        {pending && <FontAwesomeIcon icon={faClock} title="Waiting to sync" aria-label="Waiting to sync" />}
        <ItemMenu
          label="Note actions"
          items={[
            { label: 'Copy', onSelect: () => void navigator.clipboard?.writeText(text) },
            { label: 'Delete', danger: true, onSelect: () => onDelete(item, 'Note deleted') },
          ]}
        />
      </div>}
    </div>
  );
};

/** The empty box at the end of a note: typing there starts a new block (created on the first autosave). */
export const TrailingBlock: React.FC<{ folderId: string; mutations: ItemMutations }> = ({ folderId, mutations }) => {
  const [text, setText] = useState('');
  const textRef = useRef('');
  const idRef = useRef<string | null>(null);
  const createdRef = useRef<NoteItemType | null>(null);
  const savedRef = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const value = textRef.current;
    if (value.trim() === '' || value === savedRef.current) return;
    savedRef.current = value;
    if (!idRef.current) {
      const id = `${folderId}::NOTE::${Date.now()}${Math.floor(Math.random() * 1000)}`;
      idRef.current = id;
      createdRef.current = { id, parentId: folderId, type: 'NOTE', content: { data: value } } as NoteItemType;
      void mutations.create('NOTE' as any, value, id);
    } else if (createdRef.current) {
      createdRef.current = { ...createdRef.current, content: { data: value } } as NoteItemType;
      void mutations.updateText(createdRef.current, value);
    }
  }, [folderId, mutations]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
  }, [text]);

  useEffect(() => () => flush(), [flush]);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    textRef.current = e.target.value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_MS);
  };

  // Once the block exists and the user leaves the box, a fresh empty box takes its place.
  const onBlur = () => {
    flush();
    if (idRef.current) {
      idRef.current = null;
      createdRef.current = null;
      savedRef.current = '';
      textRef.current = '';
      setText('');
    }
  };

  return (
    <div className="note-block swiper-no-swiping">
      <textarea
        ref={areaRef}
        className="note-block-area note-block-new"
        aria-label="New note text"
        placeholder="Add a note..."
        value={text}
        onChange={onChange}
        onBlur={onBlur}
        rows={1}
      />
    </div>
  );
};
