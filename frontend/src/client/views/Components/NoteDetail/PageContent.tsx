import React from 'react';
import { Note } from '../../Helpers/types';
import { AddItemForm, EditNameForm } from './forms';

type PageContentProps = {
  person: Note;
  editName: boolean;
  showAddItem: boolean;
  tags: React.ReactNode;
  showTag: string | null;
  addLable: any;
  notes: Note[] | null;
  index?: number;
  lastPage?: boolean;
  submitNameChange: (e: React.FormEvent<HTMLFormElement>) => void;
  submitNewItem: (e: React.FormEvent<HTMLFormElement>) => void;
  cancelAddItemEdit: () => void;
};

const PageContent: React.FC<PageContentProps> = ({
  person,
  editName,
  showAddItem,
  tags,
  showTag,
  addLable,
  notes,
  index = 0,
  lastPage,
  submitNameChange,
  submitNewItem,
  cancelAddItemEdit,
}) => {

  const isFirstPage = index === 0;
  const className = isFirstPage ? 'note-detail-item first-note-detail-item' : 'note-detail-item';
  const localShowTag = localStorage.getItem('showTag');
  const heading =
    lastPage && localShowTag && showTag && showTag !== 'null' && index && index > 1
      ? showTag
      : person.heading;

  return (
    <div id={isFirstPage ? 'isFirstPage' : ''} className={className} key={person.id}>
      {editName ? (
        <div>
          <EditNameForm heading={person.heading} onSubmit={submitNameChange} />
        </div>
      ) : (
        <div id="personContainer" className="page-content-top1">
          <h1 id="personHead" className="nameBox">
            {heading}
          </h1>
        </div>
      )}

      {showAddItem && (
        <div className="add-item-comp">
          <AddItemForm
            showTag={showTag}
            addLable={addLable}
            notes={notes}
            onSubmit={submitNewItem}
            onCancel={cancelAddItemEdit}
          />
        </div>
      )}
      {tags && <div> {tags} </div>}
      <br />
    </div>
  );
};

export default PageContent;
