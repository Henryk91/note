import React from 'react';
import { Link } from 'react-router-dom';
import { Note } from '../../Helpers/types';
import AutoCompleteTextArea from './AutoCompleteTextArea';

type BaseProps = {
  themeBack: string;
};

export const NewEmailField: React.FC<BaseProps> = ({ themeBack }) => (
  <div>
    <input className={themeBack} name="number" type="email" placeholder="Add Email" />
    <br />
    <br />
  </div>
);

export const NewNumberField: React.FC<BaseProps> = ({ themeBack }) => (
  <div>
    <input className={themeBack} name="number" type="number" placeholder="Add Number" />
    <br />
    <br />
  </div>
);

type NewUploadFieldProps = BaseProps & {
  showTag?: string | null;
  upload: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const NewUploadField: React.FC<NewUploadFieldProps> = ({ themeBack, showTag, upload, onFileChange }) => (
  <div>
    <input className={themeBack} name="tagTypeText" type="text" placeholder="Sub Heading" defaultValue={showTag ?? ''} />
    <br />
    <input onChange={onFileChange} className={themeBack} name="upload" type="file" />
    {upload !== null ? (
      <input style={{ visibility: 'hidden', height: '0px', width: '0px' }} name="number" type="text" defaultValue={upload} />
    ) : null}
    <br />
  </div>
);

type NewLogFieldProps = BaseProps & {
  inputDisplayDate: string;
  displayDate: Date | null;
  lable?: string;
  onChangeDate: (e: React.FormEvent<HTMLFormElement> | React.ChangeEvent<HTMLInputElement>) => void;
  onTodoChange: (val: string) => void;
};

export const NewLogField: React.FC<NewLogFieldProps> = ({
  inputDisplayDate,
  themeBack,
  displayDate,
  lable,
  onChangeDate,
  onTodoChange,
}) => (
  <div>
    <input onChange={onChangeDate as any} value={inputDisplayDate} className={themeBack} type="datetime-local" name="dateSelector" />
    <br />
    <input
      id="text-date"
      className={themeBack}
      name="tagTypeText"
      type="text"
      defaultValue={displayDate || undefined}
      onChange={(e) => onTodoChange(e.target.value)}
    />
    <br />
    {lable ? (
      <input className={themeBack} name="number" type="text" defaultValue={lable} />
    ) : (
      <AutoCompleteTextArea
        elementId="dynamic-text-area"
        className={`${themeBack}`}
        smallClassName="small-text-area"
        bigClassName="big-text-area"
        placeholder="Info"
        name="number"
      />
    )}
    <br />
  </div>
);

type NewNoteFieldProps = BaseProps & {
  showTag?: string | null;
};

export const NewNoteField: React.FC<NewNoteFieldProps> = ({ themeBack, showTag }) => {
  let localShowTag = showTag ?? '';
  const creatingNewFolder = localStorage.getItem('new-folder-edit');
  let defaultVal = '';
  if (creatingNewFolder) {
    localShowTag = 'Note';
    defaultVal = '1.';
  }
  return (
    <div>
      <input
        className={themeBack}
        name="tagTypeText"
        type="text"
        placeholder="Sub Heading"
        defaultValue={localShowTag}
      />
      <br />
      <AutoCompleteTextArea
        elementId="dynamic-text-area-a"
        className={`${themeBack}`}
        smallClassName="input-div-text-area"
        bigClassName="div-text-area"
        placeholder="eg: Company, Note"
        defaultValue={defaultVal}
        name="number"
      />
      <br />
    </div>
  );
};

type NewLinkFieldProps = BaseProps & {
  themeHover: string;
  notes?: Note[] | null;
  onChangeLink: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onNewFolder: () => void;
};

export const NewLinkField: React.FC<NewLinkFieldProps> = ({
  themeBack,
  themeHover,
  notes,
  onChangeLink,
  onNewFolder,
}) => {
  const headings =
    notes?.map((note) => ({ heading: note.heading, id: note.id })) ?? [];

  let defaultId = headings[headings.length - 1]?.id ?? '';
  const options = headings.map((item) => (
    <option key={item.id} value={item.id}>
      {item.heading}
    </option>
  ));
  const defaultVal =
    headings && headings.length
      ? headings[headings.length - 1].heading.replace('Sub: ', '')
      : '';
  return (
    <div>
      <br />
      <Link
        style={{ textDecoration: 'none', color: 'white' }}
        className={`${themeHover} ${themeBack}`}
        to="/new-note/"
        onClick={onNewFolder}
      >
        New Folder
      </Link>
      <br />
      <select onChange={onChangeLink} className={themeBack} name="number" id="links" defaultValue={defaultId}>
        {options}
      </select>
      <br />
      <input
        id="link-text"
        className={themeBack}
        name="tagTypeText"
        type="text"
        defaultValue={defaultVal}
      />
      <br />
    </div>
  );
};
