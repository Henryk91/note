import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import NoteDetailTags from './NoteDetailTags';
import { useSelector } from 'react-redux';
import { removeLastPage, setEditName, setSelectedNoteName, setShowTag } from '../../../auth/store/personSlice';
import { ItemMenu, ItemMenuEntry } from '../../edit/ItemMenu';
import { SaveIndicator } from '../../edit/SaveIndicator';
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
import { PinnedLogs } from '../../log/PinnedLogs';
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

  // A log is not a list of items: it gets its own screen (quick entry box, day navigation, timeline).
  if (isLogId(pageLink?.params.id)) return <LogScreen logId={pageLink.params.id} />;

  const isNoteNames = location.pathname === '/notes/note-names';
  const titleMenu: ItemMenuEntry[] = [];
  if (folderItem) {
    titleMenu.push({ label: 'Rename', onSelect: () => dispatch(setEditName(true)) });
    titleMenu.push({
      label: 'Delete folder',
      danger: true,
      onSelect: () => {
        deleteWithUndo(folderItem as any, 'Folder deleted');
        dispatch(setShowTag(null));
        dispatch(removeLastPage());
      },
    });
  } else {
    titleMenu.push({
      label: 'Open or create notebook...',
      onSelect: () => {
        // eslint-disable-next-line no-alert
        const name = window.prompt('Notebook name');
        if (name && name.trim()) dispatch(setSelectedNoteName(name.trim()));
      },
    });
  }
  titleMenu.push({ label: 'Recently deleted', onSelect: () => history.push('/recently-deleted') });

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
            <div className="doc-title-row">
              <h1 id="personHead" className="nameBox">
                {heading || '<NAME NOT SET>'}
              </h1>
              {isLastPage && <ItemMenu label="Folder options" items={titleMenu} />}
            </div>
            {isLastPage && <SaveIndicator />}
          </div>
        )}

        {showAddItem && isLastPage && (
          <AddItemForm addLabel={addLabel} onSubmit={submitNewItem} onCancel={cancelAddItemEdit} />
        )}
        {index === 0 && <PinnedLogs notebook={personToRender.id} />}
        <NoteDetailTags
          person={personToRender}
          isLastPage={isLastPage}
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
    </div>
  );
};

export default NoteDetail;
