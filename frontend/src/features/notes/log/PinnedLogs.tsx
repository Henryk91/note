import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { pathForFolder } from '../hooks/useFolderUrlSync';
import { usePinnedLogs } from './QuickLogSheet';
import { useLogData } from './useLogData';
import { firstLine, formatDuration } from './logModel';

const PinnedCard: React.FC<{ id: string; label: string }> = ({ id, label }) => {
  const history = useHistory();
  const { entries } = useLogData(id);
  const last = entries[entries.length - 1];
  return (
    <button
      type="button"
      className="log-row-link"
      style={{ width: '100%', background: 'transparent', border: 0, color: 'white', margin: 0 }}
      onClick={() => history.push(pathForFolder(id))}
      aria-label={`Open pinned log ${label}`}
    >
      <span className="log-row-text">
        <h3 className="white-color" style={{ margin: 0 }}>
          {label}
        </h3>
        <div className="log-row-sub">{last ? `${firstLine(last.text)} · ${formatDuration(Date.now() - last.ts)} ago` : 'No entries yet'}</div>
      </span>
    </button>
  );
};

/** Pinned logs of this notebook, at the top of the notebook home. */
export const PinnedLogs: React.FC<{ notebook: string }> = ({ notebook }) => {
  const authToken = useSelector((state: RootState) => state.person.authToken);
  const { data } = usePinnedLogs(!!authToken);
  const mine = (data ?? []).filter((p) => p.notebook === notebook);
  if (!mine.length) return null;
  return (
    <div className="detailTitleBox link-border" data-testid="pinned-logs">
      <div style={{ fontSize: 12, color: '#9fb6c4', textAlign: 'left', paddingLeft: 10 }}>Pinned</div>
      {mine.map((p) => (
        <PinnedCard key={p.id} id={p.id} label={p.label} />
      ))}
    </div>
  );
};
