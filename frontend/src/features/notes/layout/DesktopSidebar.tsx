import { IconBook, IconChevronDown, IconChevronRight, IconClock } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
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

const COLLAPSE_KEY = 'side-notebooks-collapsed';
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

/** Left pane: notebooks, the nested folder tree of the current notebook, pinned logs, apps and account. */
export const DesktopSidebar: React.FC<DesktopSidebarProps> = (props) => {
  const { notebook, folderId, expandedIds, onToggle, onSelectFolder, onSelectNotebook, onOpenLog, onDropItem } = props;
  const authToken = useSelector((state: RootState) => state.person.authToken);
  const { data: names } = useNoteNames(!!authToken);
  const { data: pinned } = usePinnedLogs(!!authToken);
  const mine = pinned ?? [];
  // Notebooks can be collapsed to just the open one (remembered per browser).
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggleCollapsed = () =>
    setCollapsed((v) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, v ? '0' : '1');
      } catch {
        /* storage unavailable */
      }
      return !v;
    });
  const notebooks = (names ?? []).filter((n) => n !== 'Site Track' && (!collapsed || n === notebook));

  return (
    <nav className="desk-sidebar" aria-label="Notebooks and folders">
      <div className="side-section">
        <button type="button" className="side-title side-title-toggle" aria-expanded={!collapsed} onClick={toggleCollapsed}>
          Notebooks
          {collapsed ? <IconChevronRight size={12} aria-hidden /> : <IconChevronDown size={12} aria-hidden />}
        </button>
        {notebooks.map((name) => (
          <button
            type="button"
            key={name}
            className={`side-item ${name === notebook ? 'is-selected' : ''}`}
            aria-current={name === notebook ? 'true' : undefined}
            onClick={() => onSelectNotebook(name)}
          >
            <IconBook size={"1em"} className="side-icon" />
            {name}
          </button>
        ))}
      </div>
      {mine.length > 0 && (
        <div className="side-section">
          <div className="side-title">Pinned logs</div>
          {mine.map((p) => (
            <button type="button" key={p.id} className="side-item" onClick={() => onOpenLog(p.id)}>
              <IconClock size={"1em"} className="side-icon is-accent" />
              {p.label.startsWith(`${notebook} / `) ? p.label.slice(notebook.length + 3) : p.label}
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
      {(names ?? []).includes('Site Track') && (
        <div className="side-section">
          <div className="side-title">Automated</div>
          <button
            type="button"
            className={`side-item ${notebook === 'Site Track' ? 'is-selected' : ''}`}
            onClick={() => onSelectNotebook('Site Track')}
          >
            <IconBook size={"1em"} className="side-icon" />
            Site Track
          </button>
        </div>
      )}
    </nav>
  );
};
