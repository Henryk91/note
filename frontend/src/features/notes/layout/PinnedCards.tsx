import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { pathForFolder } from '../hooks/useFolderUrlSync';
import { usePinnedLogs } from '../log/QuickLogSheet';
import { useLogData } from '../log/useLogData';
import { pinnedStats } from '../log/logModel';

const Card: React.FC<{ id: string; label: string }> = ({ id, label }) => {
  const history = useHistory();
  const { entries, mode, settings } = useLogData(id);
  const stats = pinnedStats(entries, mode, Date.now(), settings.breakWords);
  return (
    <button type="button" className="pin-card" onClick={() => history.push(pathForFolder(id))} aria-label={`Open pinned log ${label}`}>
      <div className="pin-card-title">
        <FontAwesomeIcon icon={faClock} /> {label.replace(' / ', ' ')}
      </div>
      <div className="pin-card-value">{stats.value}</div>
      <div className="pin-card-sub">{stats.sub}</div>
    </button>
  );
};

/** "Pinned logs" cards on the notebook home: one live number per log. */
export const PinnedCards: React.FC = () => {
  const authToken = useSelector((state: RootState) => state.person.authToken);
  const { data } = usePinnedLogs(!!authToken);
  if (!data || data.length === 0) return null;
  return (
    <>
      <div className="cap">Pinned logs</div>
      <div className="pin-grid" data-testid="pinned-logs">
        {data.map((p) => (
          <Card key={p.id} id={p.id} label={p.label} />
        ))}
      </div>
    </>
  );
};
