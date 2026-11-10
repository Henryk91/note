import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { RootState } from '../../../core/store';
import { setSelectedNoteName } from '../../auth/store/personSlice';
import { useNotesWithChildren } from '../hooks/useNotesQueries';
import { folderIdFromPath, pathForFolder } from '../hooks/useFolderUrlSync';
import { useItemMutations } from '../edit/itemMutations';
import { useDeleteWithUndo } from '../edit/useDeleteWithUndo';
import { NoteItemType, ItemType } from '../../../shared/utils/Helpers/types';
import { isLogId } from '../log/useLogData';
import { DesktopSidebar } from './DesktopSidebar';
import { ListPane } from './ListPane';
import { DocumentPane } from './DocumentPane';
import { LogScreen } from '../log/LogScreen';
import { MoveToSheet } from './MoveToSheet';
import { Breakpoint } from './useBreakpoint';
import { FOCUS_SEARCH_EVENT, NEW_NOTE_EVENT } from './events';

const WIDTHS_KEY = 'desk-widths';
const DEFAULT_WIDTHS = { sidebar: 220, list: 300 };

const readWidths = () => {
  try {
    const raw = localStorage.getItem(WIDTHS_KEY);
    if (raw) return { ...DEFAULT_WIDTHS, ...JSON.parse(raw) } as typeof DEFAULT_WIDTHS;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_WIDTHS;
};


const Resizer: React.FC<{ label: string; onDrag: (dx: number) => void; onEnd: () => void }> = ({ label, onDrag, onEnd }) => {
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    let last = e.clientX;
    const move = (ev: PointerEvent) => {
      onDrag(ev.clientX - last);
      last = ev.clientX;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      onEnd();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div
      className="desk-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      onPointerDown={start}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onDrag(-16);
        if (e.key === 'ArrowRight') onDrag(16);
      }}
    />
  );
};

/**
 * >= 768 px: list + editor (the folder tree slides in from the left). >= 1100 px: sidebar + list + editor.
 * Selecting a folder in the tree, opening a card, or selecting a card is all URL driven (`/f/:id`, `/n/:id`).
 */
export const DesktopLayout: React.FC<{ breakpoint: Exclude<Breakpoint, 'mobile'> }> = ({ breakpoint }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const { pages, selectedNoteName } = useSelector((state: RootState) => state.person);
  const byId = useSelector((state: RootState) => state.person.byId);

  const notebook = pages[0]?.params.id || selectedNoteName || '';
  const folderId = pages[pages.length - 1]?.params.id || notebook;

  const { data } = useNotesWithChildren(folderId, !!folderId);
  const items: NoteItemType[] = data?.notes?.[folderId]?.dataLable ?? byId[folderId]?.dataLable ?? [];
  const notes = items.filter((i) => i.type === 'NOTE');
  const folderIsLog = isLogId(folderId);

  // `/n/:id` selects a note of the open folder; otherwise the first note is shown (like the mockup).
  const rawSelected = pathname.startsWith('/n/') ? folderIdFromPath(pathname) : null;
  const selectedId = notes.find((n) => n.id === rawSelected)?.id ?? notes[0]?.id ?? null;
  const selectedNote = notes.find((n) => n.id === selectedId);

  // Path shown above the list and the editor: "Train / Core".
  const nameOf = (id: string, parent: string) =>
    byId[parent]?.dataLable?.find((d) => d.id === id)?.name || (id === notebook ? notebook : id.split('::').pop() || '');
  const pathText = pages.length <= 1 ? notebook : pages.slice(1).map((p, i) => nameOf(p.params.id, pages[i].params.id)).join(' / ');

  const folderMutations = useItemMutations(folderId);
  const deleteInFolder = useDeleteWithUndo(folderMutations);

  // ---- tree expansion: everything on the path to the open folder is open -----------------------------
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(pages.map((p) => p.params.id)));
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      pages.forEach((p) => next.add(p.params.id));
      return next.size === prev.size ? prev : next;
    });
  }, [pages]);
  const toggle = useCallback(
    (id: string) =>
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );

  // ---- navigation -------------------------------------------------------------------------------------
  const goFolder = useCallback(
    (id: string) => history.push(id === notebook ? '/notes/main' : pathForFolder(id)),
    [history, notebook],
  );
  const select = useCallback(
    (id: string) => {
      const target = `/n/${encodeURIComponent(id)}`;
      if (pathname.startsWith('/n/')) history.replace(target);
      else history.push(target);
    },
    [history, pathname],
  );
  const selectNotebook = (name: string) => {
    dispatch(setSelectedNoteName(name));
    history.push('/notes/main');
  };

  // ---- creating, deleting, moving ---------------------------------------------------------------------
  const [editToken, setEditToken] = useState(0);
  const newNote = useCallback(async () => {
    if (!folderId || isLogId(folderId)) return;
    const id = `${folderId}::${ItemType.NOTE}::${Date.now()}`;
    await folderMutations.create(ItemType.NOTE, 'New note', id);
    history.push(`/n/${encodeURIComponent(id)}`);
    setTimeout(() => setEditToken((t) => t + 1), 200);
  }, [folderId, folderMutations, history]);

  const [moving, setMoving] = useState<NoteItemType | null>(null);
  const doMove = (item: NoteItemType, target: string) => {
    void folderMutations.move(item, target);
    if (item.id === selectedId) goFolder(folderId);
  };
  const removeNote = (item: NoteItemType, label = 'Note deleted') => {
    deleteInFolder(item, label);
    if (item.id === selectedId) goFolder(folderId);
  };

  // ---- keyboard shortcuts ----------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if ((mod && key === 'n') || (e.altKey && key === 'n')) {
        e.preventDefault();
        void newNote();
      } else if (mod && key === 'f') {
        e.preventDefault();
        window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT));
      } else if (e.key === 'Escape') {
        const el = document.activeElement as HTMLElement | null;
        if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') && el.closest('.doc-pane')) {
          el.blur();
          (document.querySelector('.list-card.is-selected') as HTMLElement | null)?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newNote]);

  // ---- panes ------------------------------------------------------------------------------------------
  const [widths, setWidths] = useState(readWidths);
  const widthsRef = useRef(widths);
  widthsRef.current = widths;
  const persistWidths = () => {
    try {
      localStorage.setItem(WIDTHS_KEY, JSON.stringify(widthsRef.current));
    } catch {
      /* storage unavailable */
    }
  };
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const [drawer, setDrawer] = useState(false);
  const showSidebar = breakpoint === 'desktop';
  const showList = !folderIsLog;

  const sidebar = (
    <DesktopSidebar
      notebook={notebook}
      folderId={folderId}
      expandedIds={expanded}
      onToggle={toggle}
      onSelectFolder={(id) => {
        goFolder(id);
        setDrawer(false);
      }}
      onSelectNotebook={(n) => {
        selectNotebook(n);
        setDrawer(false);
      }}
      onOpenLog={(id) => {
        history.push(pathForFolder(id));
        setDrawer(false);
      }}
      onDropItem={doMove}
    />
  );

  const cols = [
    ...(showSidebar ? [`${widths.sidebar}px`, '1px'] : []),
    ...(showList ? [`${widths.list}px`, '1px'] : []),
    'minmax(0, 1fr)',
  ].join(' ');

  return (
    <div className="desk" data-testid="desk" data-layout={breakpoint} style={{ gridTemplateColumns: cols }}>
      {showSidebar && (
        <>
          {sidebar}
          <Resizer
            label="Resize sidebar"
            onDrag={(dx) => setWidths((w) => ({ ...w, sidebar: clamp(w.sidebar + dx, 180, 420) }))}
            onEnd={persistWidths}
          />
        </>
      )}
      {showList && (
        <>
          <ListPane
            path={pathText}
            notes={notes}
            selectedId={selectedId}
            onSelect={select}
            onMove={setMoving}
            onDelete={removeNote}
            onNew={() => void newNote()}
            headerExtra={
              !showSidebar ? (
                <button type="button" className="list-new" aria-label="Show folders" aria-expanded={drawer} onClick={() => setDrawer((v) => !v)}>
                  &#9776;
                </button>
              ) : null
            }
          />
          <Resizer
            label="Resize list"
            onDrag={(dx) => setWidths((w) => ({ ...w, list: clamp(w.list + dx, 220, 560) }))}
            onEnd={persistWidths}
          />
        </>
      )}
      <main className="desk-editor" aria-label="Editor">
        {folderIsLog ? (
          <LogScreen logId={folderId} />
        ) : (
          <DocumentPane
            note={selectedNote}
            path={pathText}
            mutations={folderMutations}
            editToken={editToken}
            onDelete={removeNote}
            onMove={setMoving}
          />
        )}
      </main>
      {!showSidebar && drawer && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="desk-drawer-backdrop" onClick={() => setDrawer(false)}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="desk-drawer" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}
      {moving && (
        <MoveToSheet
          item={moving}
          notebook={notebook}
          initiallyOpen={pages.map((p) => p.params.id)}
          onPick={(target) => doMove(moving, target)}
          onClose={() => setMoving(null)}
        />
      )}
    </div>
  );
};
