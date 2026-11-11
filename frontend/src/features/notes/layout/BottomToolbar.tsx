import { IconBolt, IconEdit, IconWifi } from '@tabler/icons-react';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { useOnlineStatus } from '../../../shared/hooks/useOnlineStatus';
import { isLogId } from '../log/useLogData';
import { QUICK_LOG_EVENT } from '../log/QuickLogSheet';
import { phoneNoteTarget } from '../editor/NoteScreen';

/** "3 notes", "2 folders", "2 folders · 3 notes" (ui-review N4). */
export const folderCountLabel = (folders: number, notes: number): string => {
  const f = `${folders} ${folders === 1 ? 'folder' : 'folders'}`;
  const n = `${notes} ${notes === 1 ? 'note' : 'notes'}`;
  if (folders && notes) return `${f} · ${n}`;
  if (notes) return n;
  return f;
};

/**
 * Phone layout: the item count, a "+ Log" quick button and a compose button, in one bar at the bottom.
 * (This replaces the floating buttons that covered the content.)
 */
export const BottomToolbar: React.FC = () => {
  const pages = useSelector((state: RootState) => state.person.pages);
  const byId = useSelector((state: RootState) => state.person.byId);
  const isOnline = useOnlineStatus();
  const folderId = pages[pages.length - 1]?.params.id ?? '';
  const history = useHistory();
  const { pathname, search } = useLocation();

  if (!folderId || isLogId(folderId)) return null;
  // The note screen has no toolbar (notes-phone.html 2 / 3).
  if (phoneNoteTarget(pathname, search, folderId)) return null;

  const items = byId[folderId]?.dataLable ?? [];
  const folderCount = items.filter((i) => i.type === 'FOLDER').length;
  const noteCount = items.filter((i) => i.type === 'NOTE').length;

  // Compose: a new, empty note in this folder, cursor in the title (created on the first keystroke).
  const newNote = () => history.push(`/n/${encodeURIComponent(folderId)}?new=1`, { fromList: true });

  return (
    <div className={`bottom-toolbar ${pages.length > 1 ? 'is-folder' : ''}`} role="toolbar" aria-label="Actions">
      <button type="button" className="bt-log" onClick={() => window.dispatchEvent(new Event(QUICK_LOG_EVENT))}>
        <IconBolt size={"1em"} /> Log
      </button>
      <span className="bt-count" data-testid="item-count">
        {folderCountLabel(folderCount, noteCount)}
        {!isOnline && <IconWifi size={"1em"} style={{ marginLeft: 8, color: 'var(--danger)' }} title="Offline" />}
      </span>
      <button type="button" className="bt-edit" aria-label="New note" onClick={newNote}>
        <IconEdit size={22} />
      </button>
    </div>
  );
};
