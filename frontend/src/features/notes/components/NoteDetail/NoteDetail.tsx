import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import NoteDetailTags from './NoteDetailTags';
import { useSelector } from 'react-redux';
import { PhoneSearch, searchScope } from '../SearchBar/SearchResults';
import { removeLastPage, setEditName, setSelectedNoteName, setShowTag } from '../../../auth/store/personSlice';
import { ItemMenu, ItemMenuEntry } from '../../edit/ItemMenu';
import { useNoteNames, useNotesWithChildren } from '../../hooks/useNotesQueries';
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
import { useFrontIndex, useHeader } from '../../../../shared/header/headerStore';
import { useNoteOperations } from '../../hooks/useNoteOperations';
import { NoteScreen, phoneNoteTarget } from '../../editor/NoteScreen';
import { askText } from '../../../../shared/components/dialog/AppDialog';
import { pathForFolder } from '../../hooks/useFolderUrlSync';
import { askAndCreateFolder, logMenuLabel, openOrCreateLog } from '../../edit/folderActions';
import { ScrollJump } from '../../../../shared/components/ScrollJump';

type NoteDetailProps = {
  index?: number;
};

const NoteDetail: React.FC<NoteDetailProps> = ({ index = 0 }) => {
  const { showAddItem, editName, pages, byId, showTag } = useSelector((state: RootState) => state.person);
  const isLastPage = index === pages.length - 1;
  // Owns the header while it is in front, including while the stack slides back to it.
  const isHeaderPage = index === useFrontIndex(pages.length);

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
  const folderMutations = useItemMutations(pageLink?.params.id || '');
  const deleteWithUndo = useDeleteWithUndo(parentMutations);

  const [moving, setMoving] = useState(false);

  // The header shows the back label, the two-line title and this page's `...` menu (docs/mockups/phone-screens.html).
  const isLog = isLogId(pageLink?.params.id);
  // Phone: `/n/<note>` shows that note full screen on top of its folder page (notes-phone.html 2 / 3).
  const noteTarget = isLastPage && !isLog ? phoneNoteTarget(location.pathname, location.search, pageLink?.params.id ?? '') : null;
  const notebookName = useSelector((state: RootState) => state.person.selectedNoteName) ?? '';
  const { data: noteNames } = useNoteNames(isLastPage);
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
      onSelect: async () => {
        const name = await askText({
          title: 'Open or create notebook',
          choices: (noteNames ?? []).filter((n) => n !== notebookName),
          choicesLabel: 'Your notebooks',
          label: 'New notebook',
          placeholder: 'Notebook name',
          confirmLabel: 'Open',
        });
        if (name) dispatch(setSelectedNoteName(name));
      },
    });
  }
  headerMenu.push({ label: 'New folder', onSelect: () => void askAndCreateFolder(folderMutations) });
  // New log (or Open log when this folder already has one): creates `<folder>::Log` and opens it.
  headerMenu.push({
    label: logMenuLabel(person?.dataLable),
    onSelect: () => void openOrCreateLog(pageLink?.params.id || '', person?.dataLable, folderMutations, (id) => history.push(pathForFolder(id))),
  });
  headerMenu.push({ label: 'Recently deleted', onSelect: () => history.push('/recently-deleted') });
  useHeader(
    {
      kicker: index === 0 ? 'NOTEBOOK' : notebookName,
      title: index === 0 ? notebookName : person?.heading || '',
      back: index > 0 ? { label: parentName || 'Back', onClick: () => window.dispatchEvent(new Event('page-back')) } : null,
      menu: headerMenu,
    },
    isHeaderPage && !isLog && !noteTarget,
  );

  // A log is not a list of items: it gets its own screen (quick entry box, day navigation, timeline).
  if (isLog) return <LogScreen logId={pageLink.params.id} />;
  if (noteTarget) {
    return (
      <NoteScreen
        key={pageLink.params.id}
        folderId={pageLink.params.id}
        noteId={noteTarget}
        folderName={index === 0 ? notebookName : person?.heading || ''}
        enabled
      />
    );
  }

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
        {/* The folder name is already the header title, so the page has no h1; renaming still shows the form here. */}
        {editName && (
          <div>
            <EditNameForm heading={person?.heading ?? ''} onSubmit={submitNameChange} />
          </div>
        )}
        {index === 0 && (
          <>
            <PhoneSearch label={searchScope(notebookName) ? `Search ${searchScope(notebookName)}` : 'Search all notes and logs'} />
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
        {isLastPage && (
          <ScrollJump
            count={personToRender?.dataLable?.length ?? 0}
            bottom="calc(var(--toolbar-h, 57px) + 12px)"
            fixedScroller={() => document.querySelector<HTMLElement>('.swiper-slide-active .scrollable-content')}
          />
        )}
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
