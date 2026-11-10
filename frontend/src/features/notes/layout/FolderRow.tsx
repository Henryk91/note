import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faClock } from '@fortawesome/free-solid-svg-icons';
import { faFolder } from '@fortawesome/free-regular-svg-icons';

type FolderRowProps = {
  name: string;
  count?: number;
  isLog?: boolean;
  onOpen: () => void;
};

/** A row of the Folders card on the phone (docs/mockups/phone-screens.html): icon, name, grey count, chevron. */
export const FolderRow: React.FC<FolderRowProps> = ({ name, count, isLog, onOpen }) => (
  <div
    className="folder-row"
    role="button"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    aria-label={isLog ? `Open log` : `Open folder ${name}`}
  >
    <FontAwesomeIcon icon={isLog ? faClock : faFolder} className="folder-row-icon" />
    <span className="folder-row-name">{name}</span>
    {count !== undefined && <span className="folder-row-count">{count}</span>}
    <FontAwesomeIcon icon={faChevronRight} className="folder-row-chev" />
  </div>
);
