import { IconSearch } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import NoteDetailTags from './NoteDetailTags';
import { useSelector } from 'react-redux';
import { removeLastPage, setEditName, setSelectedNoteName, setShowTag } from '../../../auth/store/personSlice';
import { ItemMenu, ItemMenuEntry } from '../../edit/ItemMenu';
import { useNotesWithChildren } from '../../hooks/useNotesQueries';
import { useItemMutations } from '../../edit/itemMutations';
import { useDeleteWithUndo } from '../../edit/useDeleteWithUndo';
import { RootState } from '../../../../core/store';
import { useLocation } from 'react-router-dom';
import { AddItemForm, EditNameForm } from './forms';
import { Note } from '../../../../shared/utils/Helpers/types';
import { useNoteNavigation } from '../../hooks/useNoteNavigation';
import { LogScreen } from '../../log/LogScreen';
import { isLogId } from '../../log/useLogData';
import { MoveToSheet } from '../../layout/MoveToSheet';
import { PinnedCards } from '../../layout/PinnedCards';
import { FOCUS_SEARCH_EVENT } from '../../layout/events';
import { useHeader } from '../../../../shared/header/headerStore';
import { useNoteOperations } from '../../hooks/useNoteOperations';

type NoteDetailProps = {
  index?: number;
};

const NoteDetail: React.FC<NoteDetailProps> = ({ index = 0 }) => {
  const { showAddItem, editName, pages, byId, showTag } = useSelector((state: RootState) => state.person);
  const isLastPage = index === pages.length - 1;

  // Resolve person
  const pageLink = pages[index];
  const person = byId?.[pageLink?.params.id] || null;

  // 1. Navigation Hook
  const { openPage, saveShowTag, showHideBox, handleLinkClick } = useNoteNavigation({ person, isLastPage });

  // 2. Operations Hook
  const { addLabel, submitNameChange, submitNewItem, cancelAddItemEdit, updateNoteItem, continueLog } =
    useNoteOperations({ person, openPage });

  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();

  // Rename / delete live in a menu on the title (never next to a Save button). Deleting is a soft delete with Undo.
  const parentId = index > 0 ? pages[index - 1]?.params.id : '';
  // After a refresh / deep link the parent folder is not loaded yet; it holds this folder's own item (for rename / delete).
  useNotesWithChildren(parentId || undefined, !!parentId && isLastPage);
  const folderItem =
    parentId && person
      ? byId?.[parentId]?.dataLable?.find((d) => d.id === person.id) ??
        ({ id: person.id, parentId, type: 'FOLDER', name: person.heading, heading: person.heading } as any)
      : undefined;
  const parentMutations = useItemMutations(parentId || pageLink?.params.id || '');
  const deleteWithUndo = useDeleteWithUndo(parentMutations);

  const [moving, setMoving] = useState(false);

  // The header shows the back label, the two-line title and this page's `...` menu (docs/mockups/phone-screens.html).
  const isLog = isLogId(pageLink?.params.id);
  const notebookName = useSelector((state: RootState) => state.person.selectedNoteName) ?? '';
  const parentName =
    index > 1
      ? (byId?.[pages[index - 2]?.params.id]?.dataLable?.find((d) => d.id === parentId)?.name ?? byId?.[parentId]?.heading ?? '')
      : notebookName;
  const headerMenu: ItemMenuEntry[] = [];
  if (folderItem && index > 0) {
    headerMenu.push({ label: 'Rename', onSelect: () => dispatch(setEditName(true)) });
    headerMenu.push({ label: 'Move to...', onSelect: () => setMoving(true) });
    headerMenu.push({
      label: 'Delete folder',
      onSelect: () => {
        deleteWithUndo(folderItem as any, 'Folder deleted');
        dispatch(setShowTag(null));
        dispatch(removeLastPage());
      },
      danger: true,
    });
  } else {
    headerMenu.push({
      label: 'Open or create notebook...',
      onSelect: () => {
        // eslint-disable-next-line no-alert
        const name = window.prompt('Notebook name');
        if (name && name.trim()) dispatch(setSelectedNoteName(name.trim()));
      },
    });
  }
  headerMenu.push({ label: 'Recently deleted', onSelect: () => history.push('/recently-deleted') });
  useHeader(
    {
      kicker: index === 0 ? 'NOTEBOOK' : notebookName,
      title: index === 0 ? notebookName : person?.heading || '',
      back: index > 0 ? { label: parentName || 'Back', onClick: () => window.dispatchEvent(new Event('page-back')) } : null,
      menu: headerMenu,
    },
    isLastPage && !isLog,
  );

  // A log is not a list of items: it gets its own screen (quick entry box, day navigation, timeline).
  if (isLog) return <LogScreen logId={pageLink.params.id} />;

  const isNoteNames = location.pathname === '/notes/note-names';
  const personToRender = isNoteNames ? null : ({ ...person } as Note);

  if (!personToRender) return null;

  // Logic from useNoteDetailLogic / NoteDetail
  const heading = isLastPage && showTag ? showTag : personToRender?.heading;
  const className = !isLastPage ? 'first-note-detail-item' : '';

  if (index === 0 && personToRender?.dataLable) {
    personToRender.dataLable = [...personToRender?.dataLable].sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  }

  return (
    <div className={`slide-in ${heading === 'Log' && 'logDetailPadding' }`}>
      <div id={!isLastPage ? 'isFirstPage' : ''} className={`${className} note-detail-item`} key={personToRender?.id}>
        {editName ? (
          <div>
            <EditNameForm heading={person?.heading ?? ''} onSubmit={submitNameChange} />
          </div>
        ) : (
          <div id="personContainer" className="page-content-top1">
            <h1 id="personHead" className="phone-h1">
              {heading || '<NAME NOT SET>'}
            </h1>
          </div>
        )}
        {index === 0 && (
          <>
            <button type="button" className="phone-search" onClick={() => window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT))}>
              <IconSearch size={"1em"} /> Search all notes and logs
            </button>
            <PinnedCards />
          </>
        )}

        {showAddItem && isLastPage && (
          <AddItemForm addLabel={addLabel} onSubmit={submitNewItem} onCancel={cancelAddItemEdit} />
        )}
        <NoteDetailTags
          person={personToRender}
          isLastPage={isLastPage}
          isRoot={index === 0}
          actions={{
            showHideBox,
            saveShowTag,
            continueLog,
            updateNoteItem,
            openFolder: (item) => handleLinkClick(item, person),
          }}
        />
        <br />
      </div>
      {moving && folderItem && (
        <MoveToSheet
          item={folderItem as any}
          notebook={pages[0]?.params.id ?? ''}
          initiallyOpen={pages.map((p) => p.params.id)}
          onPick={(target) => {
            void parentMutations.move(folderItem as any, target);
            dispatch(setShowTag(null));
            dispatch(removeLastPage());
          }}
          onClose={() => setMoving(false)}
        />
      )}
    </div>
  );
};

export default NoteDetail;
