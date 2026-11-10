import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { RootState } from '../../../core/store';
import { setPages, setSelectedNoteName } from '../../auth/store/personSlice';
import { PageDescriptor } from '../../../shared/utils/Helpers/types';
import { apiFetch } from '../../../shared/utils/Helpers/apiFetch';

const page = (id: string): PageDescriptor => ({ params: { id, tempId: id } });

/**
 * Folder ids are built as `<parent>::FOLDER::<x>` (and `<parent>::Log` for logs, `<notebook>::<site>` for Site Track),
 * so the chain of ancestors can be rebuilt from the id alone. Ids of NOTE / LOG items resolve to the folder that contains them.
 */
export const buildFolderChain = (id: string): string[] => {
  const parts = id.split('::');
  const chain = [parts[0]];
  let i = 1;
  while (i < parts.length) {
    if (parts[i] === 'FOLDER' && parts[i + 1] !== undefined) {
      chain.push(parts.slice(0, i + 2).join('::'));
      i += 2;
    } else if (parts[i] === 'NOTE' || parts[i] === 'LOG') {
      break;
    } else {
      // `Log` folders and legacy ids such as `<notebook>::<site>` (Site Track): one segment is one folder.
      chain.push(parts.slice(0, i + 1).join('::'));
      i += 1;
    }
  }
  return chain;
};

export const folderIdFromPath = (pathname: string): string | null => {
  const m = pathname.match(/^\/(?:f|n)\/(.+)$/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
};

export const pathForFolder = (id: string) => `/f/${encodeURIComponent(id)}`;

const isStackRoute = (pathname: string) =>
  pathname === '/' ||
  pathname === '/index.html' ||
  pathname === '/notes/main' ||
  /^\/(f|n)\//.test(pathname);

/**
 * Keeps the URL and the navigation stack (Redux `pages`) in sync, so a folder has a real URL (`/f/:folderId`),
 * a refresh stays on the same folder and the browser Back button walks back up the stack.
 */
type SyncOptions = {
  /**
   * Wide layouts: `/n/:id` means "folder = parent of id, with id selected in the list pane". On phones `/n/:id`
   * is the same screen as `/f/:id`.
   */
  selectionMode?: boolean;
};

export const useFolderUrlSync = ({ selectionMode = false }: SyncOptions = {}) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const { pages, selectedNoteName, authToken } = useSelector((state: RootState) => state.person);
  const pendingTarget = useRef<string | null>(null);
  const firstRun = useRef(true);

  const lastId = pages[pages.length - 1]?.params.id;

  // URL -> stack (first load on a folder URL, and browser Back / Forward).
  useEffect(() => {
    const isFirst = firstRun.current;
    firstRun.current = false;
    if (!authToken) return;

    const folderId = folderIdFromPath(pathname);
    if (folderId) {
      const full = buildFolderChain(folderId);
      const isSelection = selectionMode && pathname.startsWith('/n/') && full.length > 1;
      const chain = isSelection ? full.slice(0, -1) : full;
      const targetId = chain[chain.length - 1];

      if (targetId === lastId) return;
      pendingTarget.current = targetId;
      const existing = pages.findIndex((p) => p.params.id === targetId);
      if (existing > -1) {
        dispatch(setPages(pages.slice(0, existing + 1)));
        return;
      }
      if (chain[0] !== selectedNoteName) dispatch(setSelectedNoteName(chain[0]));
      dispatch(setPages(chain.map(page)));
      // Items can be moved, so the id alone may not be the real path: ask the server once and correct the stack.
      void apiFetch(`/api/note-v2/path?id=${encodeURIComponent(folderId)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((path: Array<{ id: string; type: string }>) => {
          if (!Array.isArray(path) || path.length === 0 || window.location.pathname !== pathname) return;
          const folders = path.filter((p) => p.type === 'FOLDER');
          const ids = (isSelection ? folders.filter((p) => p.id !== folderId) : folders).map((p) => p.id);
          if (ids.length === 0 || ids.join('|') === chain.join('|')) return;
          pendingTarget.current = ids[ids.length - 1];
          if (ids[0] !== chain[0]) dispatch(setSelectedNoteName(ids[0]));
          dispatch(setPages(ids.map(page)));
        })
        .catch(() => undefined);
      return;
    }

    // Going back to the plain notebook URL (not on first load, where the saved stack is restored).
    if (!isFirst && (pathname === '/notes/main' || pathname === '/') && pages.length > 1) {
      pendingTarget.current = pages[0].params.id;
      dispatch(setPages(pages.slice(0, 1)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, authToken]);

  // stack -> URL
  useEffect(() => {
    if (!authToken || !isStackRoute(pathname)) return;
    if (pendingTarget.current) {
      if (pendingTarget.current === lastId) pendingTarget.current = null;
      return;
    }
    if (selectionMode && pathname.startsWith('/n/')) {
      const sel = folderIdFromPath(pathname);
      const chain = sel ? buildFolderChain(sel) : [];
      if (chain.length > 1 && chain[chain.length - 2] === lastId) return; // the folder of the selected item is open
    }
    const desired = pages.length > 1 && lastId ? pathForFolder(lastId) : '/notes/main';
    if (desired === pathname || (desired === '/notes/main' && pathname === '/')) return;
    // Plain notebook URLs are replaced (no extra history entry); folders are pushed so Back works.
    const replace = pathname === '/' || pathname === '/index.html' || (!folderIdFromPath(pathname) && pages.length > 1 && firstRun.current);
    if (replace) history.replace(desired);
    else history.push(desired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, pages.length, authToken]);
};
