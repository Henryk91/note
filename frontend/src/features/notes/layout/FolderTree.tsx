import { IconChevronDown, IconChevronRight, IconClock, IconFolder } from '@tabler/icons-react';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { useNotesWithChildren } from '../hooks/useNotesQueries';
import { NoteItemType } from '../../../shared/utils/Helpers/types';

export const DRAG_TYPE = 'application/x-note-item';

type TreeProps = {
  rootId: string;
  rootLabel: string;
  /** Show the notebook itself as the first row (the "Move to..." picker does; the sidebar does not). */
  showRoot?: boolean;
  selectedId?: string | null;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  /** Drag and drop: an item was dropped on this folder. */
  onDropItem?: (item: NoteItemType, targetId: string) => void;
  /** Ids that cannot be picked (the item being moved and everything below it). */
  disabledIds?: Set<string>;
};

type NodeProps = TreeProps & { id: string; label: string; depth: number; isLog?: boolean };

/** Data order, with the Log folder last (as in the desktop mockup). */
const orderFolders = (folders: NoteItemType[]) => [...folders.filter((f) => f.name !== 'Log'), ...folders.filter((f) => f.name === 'Log')];

const renderChild = (f: NoteItemType, props: TreeProps, depth: number) => {
  const log = f.name === 'Log';
  return (
    <TreeNode key={f.id} {...props} id={f.id} label={log ? 'Log' : f.name || f.heading || f.id} depth={depth} isLog={log} />
  );
};

const TreeNode: React.FC<NodeProps> = (props) => {
  const { id, label, depth, isLog, selectedId, expandedIds, onToggle, onSelect, onDropItem, disabledIds } = props;
  const expanded = expandedIds.has(id);
  const byId = useSelector((state: RootState) => state.person.byId);
  // Children are loaded when the node is open (the top level is always loaded by the app itself).
  const { data } = useNotesWithChildren(id, expanded);
  const items: NoteItemType[] = data?.notes?.[id]?.dataLable ?? byId[id]?.dataLable ?? [];
  const folders = items.filter((i) => i.type === 'FOLDER');
  // The parent's response lists children of children, so a folder without an entry has no children.
  const hasFolders = folders.length > 0;
  const disabled = disabledIds?.has(id);

  const [over, setOver] = React.useState(false);

  return (
    <li role="none">
      <div
        role="treeitem"
        aria-level={depth + 1}
        aria-selected={selectedId === id}
        aria-expanded={isLog || !hasFolders ? undefined : expanded}
        aria-disabled={disabled || undefined}
        tabIndex={0}
        className={`tree-row ${selectedId === id ? 'is-selected' : ''} ${over ? 'is-drop' : ''} ${disabled ? 'is-disabled' : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => !disabled && onSelect(id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !disabled) onSelect(id);
          if (e.key === 'ArrowRight' && !expanded && hasFolders) onToggle(id);
          if (e.key === 'ArrowLeft' && expanded) onToggle(id);
        }}
        onDragOver={(e) => {
          if (!onDropItem || isLog || disabled || !e.dataTransfer.types.includes(DRAG_TYPE)) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          setOver(false);
          if (!onDropItem || isLog || disabled) return;
          const raw = e.dataTransfer.getData(DRAG_TYPE);
          if (!raw) return;
          e.preventDefault();
          try {
            onDropItem(JSON.parse(raw) as NoteItemType, id);
          } catch {
            /* ignore malformed drags */
          }
        }}
      >
        {isLog || !hasFolders ? (
          <span className="tree-chev" />
        ) : (
          <button
            type="button"
            className="tree-chev"
            aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(id);
            }}
          >
            {expanded ? <IconChevronDown size={"1em"} /> : <IconChevronRight size={"1em"} />}
          </button>
        )}
        {isLog ? <IconClock size={"1em"} className="tree-icon" /> : <IconFolder size={"1em"} className="tree-icon" />}
        <span className="tree-label">{label}</span>
      </div>
      {expanded && folders.length > 0 && (
        <ul role="group" className="tree-list">
          {orderFolders(folders).map((f) => renderChild(f, props, depth + 1))}
        </ul>
      )}
    </li>
  );
};

const TopLevel: React.FC<TreeProps> = (props) => {
  const { data } = useNotesWithChildren(props.rootId, true);
  const byId = useSelector((state: RootState) => state.person.byId);
  const items: NoteItemType[] = data?.notes?.[props.rootId]?.dataLable ?? byId[props.rootId]?.dataLable ?? [];
  return <>{orderFolders(items.filter((i) => i.type === 'FOLDER')).map((f) => renderChild(f, props, 0))}</>;
};

/** Collapsible folder tree, any depth. Used for the desktop sidebar and for the "Move to..." picker. */
export const FolderTree: React.FC<TreeProps> = (props) => (
  <ul role="tree" className="tree-list tree-root" aria-label="Folders">
    {props.showRoot ? <TreeNode {...props} id={props.rootId} label={props.rootLabel} depth={0} /> : <TopLevel {...props} />}
  </ul>
);
