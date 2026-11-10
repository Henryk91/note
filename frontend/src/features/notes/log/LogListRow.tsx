import { IconClock } from '@tabler/icons-react';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { NoteItemType } from '../../../shared/utils/Helpers/types';
import { buildEntries, firstLine, formatDuration } from './logModel';

type LogListRowProps = {
  logItem: NoteItemType;
  items: NoteItemType[] | undefined;
  onOpen: () => void;
};

/** A log in a folder list: clock icon, the last entry and how long ago it was. Tapping opens the log screen. */
export const LogListRow: React.FC<LogListRowProps> = ({ logItem, items, onOpen }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const last = useMemo(() => {
    const entries = buildEntries(items);
    return entries[entries.length - 1];
  }, [items]);

  return (
    <div className="detailTitleBox dark-hover link-border">
      <button type="button" className="log-row-link" onClick={onOpen} aria-label={`Open log${last ? `, last entry ${firstLine(last.text)}` : ''}`} style={{ width: '100%', background: 'transparent', border: 0, color: 'white', margin: 0 }}>
        <span className={`log-row-clock ${theme}-border-thick`}>
          <IconClock size={"1em"} />
        </span>
        <span className="log-row-text">
          <h3 className="white-color" style={{ margin: 0 }}>
            {logItem.name || 'Log'}
          </h3>
          {last ? (
            <div className="log-row-sub">
              {firstLine(last.text)} · {formatDuration(Date.now() - last.ts)} ago
            </div>
          ) : (
            <div className="log-row-sub">No entries yet</div>
          )}
        </span>
        {items && items.length > 0 && <span className="row-count">{items.length}</span>}
      </button>
    </div>
  );
};
