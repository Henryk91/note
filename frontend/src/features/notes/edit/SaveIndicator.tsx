import React from 'react';
import { useSaveStatus } from './itemMutations';

const TEXT = { idle: '', saving: 'Saving...', saved: 'Saved', offline: 'Offline, will sync' } as const;

export const SaveIndicator: React.FC = () => {
  const status = useSaveStatus();
  return (
    <span className="save-indicator" role="status" aria-live="polite" data-status={status}>
      {TEXT[status]}
    </span>
  );
};
