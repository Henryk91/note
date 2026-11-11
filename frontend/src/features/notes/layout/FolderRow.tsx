import { IconChevronRight, IconClock, IconFolder } from '@tabler/icons-react';
import React from 'react';

type FolderRowProps = {
  name: string;
  count?: number;
  isLog?: boolean;
  onOpen: () => void;
};

/** A row of the Folders card on the phone (docs/mockups/phone-screens.html): icon, name, grey count, chevron. */
export const FolderRow: React.FC<FolderRowProps> = ({ name, count, isLog, onOpen }) => (
  <button
    type="button"
    className="folder-row"
    onClick={onOpen}
    aria-label={isLog ? `Open log` : `Open folder ${name}`}
  >
    {isLog ? <IconClock size={"1em"} className="folder-row-icon" /> : <IconFolder size={"1em"} className="folder-row-icon" />}
    <span className="folder-row-name">{name}</span>
    {count !== undefined && <span className="folder-row-count">{count}</span>}
    <IconChevronRight size="1em" className="folder-row-chev" />
  </button>
);
