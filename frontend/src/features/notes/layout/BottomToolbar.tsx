import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faEdit, faWifi } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/store';
import { useOnlineStatus } from '../../../shared/hooks/useOnlineStatus';
import { useItemMutations } from '../edit/itemMutations';
import { ItemType } from '../../../shared/utils/Helpers/types';
import { isLogId } from '../log/useLogData';
import { QUICK_LOG_EVENT } from '../log/QuickLogSheet';

/**
 * Phone layout: the item count, a "+ Log" quick button and a compose button, in one bar at the bottom.
 * (This replaces the floating buttons that covered the content.)
 */
export const BottomToolbar: React.FC = () => {
  const pages = useSelector((state: RootState) => state.person.pages);
  const byId = useSelector((state: RootState) => state.person.byId);
  const isOnline = useOnlineStatus();
  const folderId = pages[pages.length - 1]?.params.id ?? '';
  const mutations = useItemMutations(folderId);
  const [menu, setMenu] = useState(false);

  if (!folderId || isLogId(folderId)) return null;

  const count = byId[folderId]?.dataLable?.length ?? 0;

  const newNote = () => {
    setMenu(false);
    const box = document.querySelector<HTMLTextAreaElement>('.swiper-slide-active textarea[aria-label="New note text"]');
    if (box) {
      box.scrollIntoView({ block: 'center' });
      box.focus();
    }
  };
  const newFolder = () => {
    setMenu(false);
    // eslint-disable-next-line no-alert
    const name = window.prompt('Folder name');
    if (name && name.trim()) {
      void mutations.create(ItemType.FOLDER, '', undefined, { name: name.trim(), heading: name.trim() } as any);
    }
  };

  return (
    <div className="bottom-toolbar" role="toolbar" aria-label="Actions">
      <span className="bt-count" data-testid="item-count">
        {count} {count === 1 ? 'item' : 'items'}
        {!isOnline && <FontAwesomeIcon icon={faWifi} style={{ marginLeft: 8, color: 'var(--danger)' }} title="Offline" />}
      </span>
      <button type="button" className="bt-btn" onClick={() => window.dispatchEvent(new Event(QUICK_LOG_EVENT))}>
        <FontAwesomeIcon icon={faClock} /> Log
      </button>
      <span className="bt-compose">
        <button type="button" className="bt-btn bt-primary" aria-label="Compose" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
          <FontAwesomeIcon icon={faEdit} />
        </button>
        {menu && (
          <div className="item-menu-list bt-menu" role="menu">
            <button type="button" role="menuitem" onClick={newNote}>
              New note
            </button>
            <button type="button" role="menuitem" onClick={newFolder}>
              New folder
            </button>
          </div>
        )}
      </span>
    </div>
  );
};
