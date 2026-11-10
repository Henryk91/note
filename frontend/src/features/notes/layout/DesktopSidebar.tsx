import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { setTheme } from '../../../core/store/themeSlice';
import { THEMES } from '../../../shared/utils/Helpers/const';
import { logoutUser } from '../../../shared/utils/Helpers/requests';
import { useNoteNames } from '../hooks/useNotesQueries';
import { usePinnedLogs } from '../log/QuickLogSheet';
import { FolderTree } from './FolderTree';
import { NoteItemType } from '../../../shared/utils/Helpers/types';

type DesktopSidebarProps = {
  notebook: string;
  folderId: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onSelectNotebook: (name: string) => void;
  onOpenLog: (id: string) => void;
  onDropItem: (item: NoteItemType, targetId: string) => void;
};

/** Left pane: notebooks, the nested folder tree of the current notebook, pinned logs, apps and account. */
export const DesktopSidebar: React.FC<DesktopSidebarProps> = (props) => {
  const { notebook, folderId, expandedIds, onToggle, onSelectFolder, onSelectNotebook, onOpenLog, onDropItem } = props;
  const dispatch = useDispatch();
  const authToken = useSelector((state: RootState) => state.person.authToken);
  const theme = useSelector((state: RootState) => state.theme.value);
  const { data: names } = useNoteNames(!!authToken);
  const { data: pinned } = usePinnedLogs(!!authToken);
  const mine = (pinned ?? []).filter((p) => p.notebook === notebook);

  return (
    <nav className="desk-sidebar" aria-label="Notebooks and folders">
      <div className="side-section">
        <div className="side-title">Notebooks</div>
        {(names ?? []).filter((n) => n !== 'Site Track').map((name) => (
          <button
            type="button"
            key={name}
            className={`side-item ${name === notebook ? 'is-selected' : ''}`}
            aria-current={name === notebook ? 'true' : undefined}
            onClick={() => onSelectNotebook(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {(names ?? []).includes('Site Track') && (
        <div className="side-section">
          <div className="side-title">Automated</div>
          <button
            type="button"
            className={`side-item ${notebook === 'Site Track' ? 'is-selected' : ''}`}
            onClick={() => onSelectNotebook('Site Track')}
          >
            Site Track
          </button>
        </div>
      )}
      {mine.length > 0 && (
        <div className="side-section">
          <div className="side-title">Pinned logs</div>
          {mine.map((p) => (
            <button type="button" key={p.id} className="side-item" onClick={() => onOpenLog(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      )}
      <div className="side-section">
        <div className="side-title">Folders</div>
        {notebook && (
          <FolderTree
            rootId={notebook}
            rootLabel={notebook}
            selectedId={folderId}
            expandedIds={expandedIds}
            onToggle={onToggle}
            onSelect={onSelectFolder}
            onDropItem={onDropItem}
          />
        )}
      </div>
      <div className="side-section">
        <div className="side-title">More</div>
        <Link className="side-item" to="/recently-deleted">
          Recently Deleted
        </Link>
        <Link className="side-item" to="/memento">
          Memento
        </Link>
        <Link className="side-item" to="/pomodoro">
          Pomodoro
        </Link>
        <div className="side-themes" role="group" aria-label="Theme">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t}
              className={`side-theme ${t === theme ? 'is-selected' : ''}`}
              aria-pressed={t === theme}
              onClick={() => dispatch(setTheme(t))}
            >
              {t}
            </button>
          ))}
        </div>
        <button type="button" className="side-item" onClick={() => logoutUser(() => window.location.reload())}>
          Log out
        </button>
      </div>
    </nav>
  );
};
