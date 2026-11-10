import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { RootState } from '../../../core/store';
import { setSelectedNoteName } from '../../auth/store/personSlice';
import { useNotesWithChildren } from '../hooks/useNotesQueries';
import { buildFolderChain, folderIdFromPath, pathForFolder } from '../hooks/useFolderUrlSync';
import { useItemMutations } from '../edit/itemMutations';
import { useDeleteWithUndo } from '../edit/useDeleteWithUndo';
import { NoteItemType, ItemType } from '../../../shared/utils/Helpers/types';
import { isLogId } from '../log/useLogData';
import { DesktopSidebar } from './DesktopSidebar';
import { ListPane } from './ListPane';
import { DocumentPane } from './DocumentPane';
import { MoveToSheet } from './MoveToSheet';
import { Breakpoint } from './useBreakpoint';
import { FOCUS_SEARCH_EVENT, NEW_NOTE_EVENT } from './events';

const WIDTHS_KEY = 'desk-widths';
const DEFAULT_WIDTHS = { sidebar: 250, list: 320 };

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
  const parentOfFolder = pages.length > 1 ? pages[pages.length - 2].params.id : '';

  const rawSelected = pathname.startsWith('/n/') ? folderIdFromPath(pathname) : null;
  const selectedChain = rawSelected ? buildFolderChain(rawSelected) : [];
  const selectedId =
    selectedChain.length > 1 && selectedChain[selectedChain.length - 2] === folderId ? selectedChain[selectedChain.length - 1] : null;
  const activeId = selectedId ?? folderId;
  const activeParent = selectedId ? folderId : parentOfFolder;

  const { data } = useNotesWithChildren(folderId, !!folderId);
  const items: NoteItemType[] = data?.notes?.[folderId]?.dataLable ?? byId[folderId]?.dataLable ?? [];
  const folderTitle = byId[parentOfFolder]?.dataLable?.find((d) => d.id === folderId)?.name || (folderId === notebook ? notebook : folderId.split('::').pop() || '');

  const folderMutations = useItemMutations(folderId);
  const activeParentMutations = useItemMutations(activeParent || folderId);
  const deleteInFolder = useDeleteWithUndo(folderMutations);
  const deleteInParent = useDeleteWithUndo(activeParentMutations);

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
  const newNote = useCallback(async () => {
    if (!folderId) return;
    const id = `${folderId}::${ItemType.FOLDER}::${Date.now()}`;
    await folderMutations.create(ItemType.FOLDER, '', id, { name: 'New note', heading: 'New note' } as Partial<NoteItemType>);
    history.push(`/n/${encodeURIComponent(id)}`);
    setTimeout(() => window.dispatchEvent(new Event(NEW_NOTE_EVENT)), 150);
  }, [folderId, folderMutations, history]);

  const [moving, setMoving] = useState<NoteItemType | null>(null);
  const doMove = (item: NoteItemType, target: string) => {
    const mutations = item.parentId === folderId ? folderMutations : activeParentMutations;
    void mutations.move(item, target);
    if (item.id === selectedId) goFolder(folderId);
    if (item.id === folderId) goFolder(parentOfFolder || notebook);
  };

  const removeCard = (item: NoteItemType) => {
    deleteInFolder(item, 'Deleted');
    if (item.id === selectedId) goFolder(folderId);
  };
  const removeActive = (item: NoteItemType) => {
    deleteInParent(item, 'Folder deleted');
    goFolder(selectedId ? folderId : parentOfFolder || notebook);
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

  const gridCols = useMemo(
    () => (showSidebar ? `${widths.sidebar}px 6px ${widths.list}px 6px minmax(0, 1fr)` : `${widths.list}px 6px minmax(0, 1fr)`),
    [showSidebar, widths],
  );

  const activeIsNotebook = activeId === notebook;

  return (
    <div className="desk" data-testid="desk" data-layout={breakpoint} style={{ gridTemplateColumns: gridCols }}>
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
      <ListPane
        title={folderTitle}
        items={items}
        selectedId={selectedId}
        onSelect={select}
        onOpen={goFolder}
        onMove={setMoving}
        onDelete={removeCard}
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
      <main className="desk-editor" aria-label="Editor">
        {activeId && (
          <DocumentPane
            key={activeId}
            folderId={activeId}
            parentId={activeParent}
            parentMutations={activeParentMutations}
            isNotebook={activeIsNotebook}
            onOpenFolder={(item) => goFolder(item.id)}
            onDeleteSelf={removeActive}
            onMoveSelf={setMoving}
          />
        )}
        {isLogId(activeId) && null}
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
