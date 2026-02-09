import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  NewEmailField,
  NewLinkField,
  NewLogField,
  NewNoteField,
  NewNumberField,
  NewUploadField,
} from './NoteInputFields';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../core/store';
import { setNewNoteMode } from '../../../auth/store/personSlice';

type EditNoteCheckProps = {
  lable?: string;
};

const addLeadingZero = (number: number) => {
  if (number < 10) return `0${number}`;
  return number;
};

const dateToInputDisplayDate = (date: Date) => {
  if (!date || Number.isNaN(date.getTime())) return '';
  const minutes = addLeadingZero(date.getMinutes());
  const hours = addLeadingZero(date.getHours());
  return `${date.toISOString().split('T')[0]}T${hours}:${minutes}`;
};

const EditNoteCheck: React.FC<EditNoteCheckProps> = ({ lable }) => {
  const theme = useSelector((state: RootState) => state.theme.themeLower);
  const { showTag, newNoteMode } = useSelector((state: RootState) => state.person);
  const dispatch = useDispatch();

  const [radioType, setRadioType] = useState('Note');
  const [upload, setUpload] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState<Date | null>(new Date());
  const [inputDisplayDate, setInputDisplayDate] = useState(dateToInputDisplayDate(new Date()));

  const changeDate = useCallback((e: React.FormEvent<HTMLFormElement> | React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = (e.target as HTMLInputElement).value;
    const date = new Date(selectedDate);
    setDisplayDate(date);
    setInputDisplayDate(dateToInputDisplayDate(date));

    const textDate = document.getElementById('text-date') as HTMLInputElement;
    if (textDate) textDate.value = date.toString();
  }, []);

  const onTodoChange = useCallback((value: string) => {
    setDisplayDate(new Date(value));
  }, []);

  const handleChangeFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
      reader.onload = () => {
        setUpload(reader?.result?.toString() || null);
      };
    }
  }, []);

  const themeBack = `${theme}-back`;

  const effectiveRadioType = useMemo(() => {
    let localRadioType = radioType;
    if (showTag === 'Log') {
      localRadioType = 'Log';
    }

    const wasEditing = newNoteMode === 'edit-link'; // Use newNoteMode
    if (wasEditing) {
      localRadioType = 'Link';
    }

    return localRadioType;
  }, [radioType, showTag, newNoteMode]);

  useEffect(() => {
    const wasEditing = newNoteMode === 'edit-link';
    if (wasEditing) {
      setRadioType('Link');
      const timeout = setTimeout(() => {
        const el = document.getElementById('submit-new-note') as HTMLButtonElement;
        if (el) el.click();
        dispatch(setNewNoteMode(null));
      }, 100);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [newNoteMode, dispatch]);

  return (
    <div className="slide-in1">
      <div className="radioBox">
        <label>Note</label>
        <label>Log</label>
        <label>Link</label>
        <label>Upload</label>
        <br />
        <input
          onClick={() => setRadioType('Note')}
          type="radio"
          name="tagType"
          value="Note"
          checked={effectiveRadioType === 'Note'}
          readOnly
        />
        <input
          onClick={() => setRadioType('Log')}
          type="radio"
          name="tagType"
          value="Log"
          checked={effectiveRadioType === 'Log'}
          readOnly
        />
        <input
          onClick={() => setRadioType('Link')}
          type="radio"
          name="tagType"
          value="Link"
          id="linkRadio"
          checked={effectiveRadioType === 'Link'}
          readOnly
        />
        <input
          onClick={() => setRadioType('Upload')}
          type="radio"
          name="tagType"
          value="Upload"
          checked={effectiveRadioType === 'Upload'}
          readOnly
        />
      </div>

      {effectiveRadioType === 'Note' && <NewNoteField />}
      {effectiveRadioType === 'Log' && (
        <NewLogField
          inputDisplayDate={inputDisplayDate}
          themeBack={themeBack}
          displayDate={displayDate}
          lable={lable}
          onChangeDate={changeDate}
          onTodoChange={(val) => onTodoChange(val)}
        />
      )}
      {effectiveRadioType === 'Link' && <NewLinkField />}
      {effectiveRadioType === 'Upload' && (
        <NewUploadField
          themeBack={themeBack}
          showTag={showTag ?? undefined}
          upload={upload}
          onFileChange={handleChangeFile}
        />
      )}
      {effectiveRadioType === 'Number' && <NewNumberField themeBack={themeBack} />}
      {effectiveRadioType === 'Email' && <NewEmailField themeBack={themeBack} />}
    </div>
  );
};

export default EditNoteCheck;
