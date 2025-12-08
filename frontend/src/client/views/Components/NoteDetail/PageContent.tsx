import React from 'react';
import { Note } from '../../Helpers/types';
import { AddItemForm, EditNameForm } from './forms';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';

type PageContentProps = {
  person: Note;
  showAddItem: boolean;
  tags: React.ReactNode;
  addLable: any;
  index?: number;
  lastPage?: boolean;
  submitNameChange: (e: React.FormEvent<HTMLFormElement>) => void;
  submitNewItem: (e: React.FormEvent<HTMLFormElement>) => void;
  cancelAddItemEdit: () => void;
};

const PageContent: React.FC<PageContentProps> = ({
  person,
  showAddItem,
  tags,
  addLable,
  index = 0,
  lastPage,
  submitNameChange,
  submitNewItem,
  cancelAddItemEdit,
}) => {
  const { showTag, editName} = useSelector((state: RootState) => state.person);
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
            {heading || "<NAME NOT SET>"}
          </h1>
        </div>
      )}

      {showAddItem && (
        <div className="add-item-comp">
          <AddItemForm
            addLable={addLable}
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
