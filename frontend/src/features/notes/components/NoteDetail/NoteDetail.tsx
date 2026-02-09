import React, { useCallback } from 'react';
import NoteDetailTags from './NoteDetailTags';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { useLocation } from 'react-router-dom';
import { AddItemForm, EditNameForm } from './forms';
import { Note } from '../../../../shared/utils/Helpers/types';
import { useNoteNavigation } from '../../hooks/useNoteNavigation';
import { useNoteOperations } from '../../hooks/useNoteOperations';
import { useNoteDateLogic } from '../../hooks/useNoteDateLogic';

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
  const {
    openPage,
    saveShowTag,
    showHideBox,
  } = useNoteNavigation({ person, isLastPage });

  // 2. Operations Hook
  const { addLabel, submitNameChange, submitNewItem, cancelAddItemEdit, updateNoteItem, continueLog } =
    useNoteOperations({ person, index, openPage });

  const location = useLocation();

  const isNoteNames = location.pathname === '/notes/note-names';
  const personToRender = isNoteNames ? null : ({ ...person } as Note);

  if (!personToRender) return null;

  // Logic from useNoteDetailLogic / NoteDetail
  const heading = isLastPage && showTag ? showTag : personToRender?.heading;
  const className = !isLastPage ? 'first-note-detail-item' : '';

  if (index === 0 && personToRender?.dataLable) {
    personToRender.dataLable = [...personToRender?.dataLable].sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  return (
    <div className="slide-in">
      <div id={!isLastPage ? 'isFirstPage' : ''} className={`${className} note-detail-item`} key={personToRender?.id}>
        {editName ? (
          <div>
            <EditNameForm heading={person?.heading ?? ''} onSubmit={submitNameChange} />
          </div>
        ) : (
          <div id="personContainer" className="page-content-top1">
            <h1 id="personHead" className="nameBox">
              {heading || '<NAME NOT SET>'}
            </h1>
          </div>
        )}

        {showAddItem && isLastPage && (
          <AddItemForm addLabel={addLabel} onSubmit={submitNewItem} onCancel={cancelAddItemEdit} />
        )}
        <NoteDetailTags
          person={personToRender}
          isLastPage={isLastPage}
          actions={{
            showHideBox,
            saveShowTag,
            continueLog,
            updateNoteItem,
          }}
        />
        <br />
      </div>
    </div>
  );
};

export default NoteDetail;
