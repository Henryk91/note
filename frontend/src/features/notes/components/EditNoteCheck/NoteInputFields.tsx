import React from 'react';
import AutoCompleteTextArea from './AutoCompleteTextArea';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';

type BaseProps = {
  themeBack: string;
};

type NewUploadFieldProps = BaseProps & {
  showTag?: string | null;
  upload: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const NewUploadField: React.FC<NewUploadFieldProps> = ({ themeBack, showTag, upload, onFileChange }) => (
  <div>
    <input
      className={themeBack}
      name="tagTypeText"
      type="text"
      placeholder="Sub Heading"
      defaultValue={showTag ?? ''}
    />
    <br />
    <input onChange={onFileChange} className={themeBack} name="upload" type="file" />
    {upload !== null ? (
      <input
        style={{ visibility: 'hidden', height: '0px', width: '0px' }}
        name="number"
        type="text"
        defaultValue={upload}
      />
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
    <input
      onChange={onChangeDate as any}
      value={inputDisplayDate}
      className={themeBack}
      type="datetime-local"
      name="dateSelector"
    />
    <br />
    <input
      id="text-date"
      className={themeBack}
      name="tagTypeText"
      type="text"
      defaultValue={displayDate?.toString() || undefined}
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

export const NewNoteField: React.FC = () => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const { showTag, newNoteMode } = useSelector((state: RootState) => state.person);
  let localShowTag = showTag ?? '';
  const creatingNewFolder = !!newNoteMode;
  let defaultVal = '';
  if (creatingNewFolder) {
    localShowTag = 'Note';
    defaultVal = '1.';
  }

  const themeBack = `${theme}-back`;
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

export const NewLinkField: React.FC = () => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const themeBack = `${theme}-back`;

  return (
    <div>
      <input
        autoFocus
        id="link-text"
        className={themeBack}
        name="tagTypeText"
        type="text"
        placeholder="Folder Name Here..."
      />
      <br />
    </div>
  );
};
