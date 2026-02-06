import React from 'react';
import { useNoteDetailLogic } from '../../hooks/useNoteDetailLogic';
import NoteDetailTags from './NoteDetailTags';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { useLocation } from 'react-router-dom';
import { AddItemForm, EditNameForm } from './forms';
import { Note } from '../../../../shared/utils/Helpers/types';

type NoteDetailProps = {
  index?: number;
};

const NoteDetail: React.FC<NoteDetailProps> = ({ index = 0 }) => {
  const { showAddItem, editName, pages, searchTerm } = useSelector((state: RootState) => state.person);
  const isLastPage = index === pages.length - 1;
  const pageCount = pages.length;

  const logicProps = {
    searchTerm,
    showAddItem,
    editName,
    isLastPage,
    pageCount,
    index,
  };

  const {
    person,
    persons,
    addLabel,
    displayDate,
    showLogDaysBunch,
    totalLogCount,
    logDayMap,
    showTag,
    selectedNoteName,
    setPrevDate,
    setNextDate,
    setDate,
    enableAnimationCheck,
    updateNoteItem,
    continueLog,
    showHideBox,
    showLogDays,
    saveShowTag,
    changeDate,
    dateBackForward,
    submitNameChange,
    submitNewItem,
    cancelAddItemEdit,
  } = useNoteDetailLogic(logicProps as any);

  const location = useLocation();

  const isNoteNames = location.pathname === '/notes/note-names';
  let personToRender = isNoteNames ? null : {...person} as Note;

  if(!personToRender) return null;

  const heading = isLastPage && showTag? showTag: personToRender?.heading;
  const className = !isLastPage ? 'first-note-detail-item' : '';
  if (index === 0 && personToRender?.dataLable){
    personToRender.dataLable = [...personToRender?.dataLable].sort((a: any, b: any) =>
      a.name.localeCompare(b.name),
    );
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
            totalLogCount={totalLogCount}
            displayDate={displayDate}
            isLastPage={isLastPage}
            showLogDaysBunch={showLogDaysBunch}
            logDayMap={logDayMap}
            actions={{
              showHideBox,
              showLogDays,
              saveShowTag,
              changeDate,
              dateBackForward,
              continueLog,
              setDate,
              updateNoteItem,
              enableAnimationCheck,
              setPrevDate,
              setNextDate,
            }}
          />
          <br />
        </div>
    </div>
  );
};

export default NoteDetail;
