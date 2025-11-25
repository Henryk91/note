import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Note } from '../../Helpers/types';
import {
  NewEmailField,
  NewLinkField,
  NewLogField,
  NewNoteField,
  NewNumberField,
  NewUploadField,
} from './NoteInputFields';

type EditNoteCheckProps = {
  allNotes?: Note[] | null;
  note?: Note | null;
  Theme: string;
  Save?: (payload: any) => void;
  showTag?: string | null;
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

const EditNoteCheck: React.FC<EditNoteCheckProps> = ({ allNotes, Theme, showTag, lable }) => {
  const [radioType, setRadioType] = useState('Note');
  const [upload, setUpload] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState<Date | null>(new Date());
  const [inputDisplayDate, setInputDisplayDate] = useState(dateToInputDisplayDate(new Date()));

  const getAllNoteHeadingsWithIds = useCallback((notes?: Note[] | null) => {
    if (notes === undefined || notes === null) return [];
    return notes.map((note) => ({
      heading: note.heading,
      id: note.id,
    }));
  }, []);

  const changeLink = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.preventDefault();
      const headings = getAllNoteHeadingsWithIds(allNotes);
      const selected = headings.find((heading) => heading.id === e.target.value);
      const linkElement = document.getElementById('link-text') as HTMLInputElement;
      if (linkElement && selected) linkElement.value = selected.heading;
    },
    [allNotes, getAllNoteHeadingsWithIds],
  );

  const changeDate = useCallback(
    (e: React.FormEvent<HTMLFormElement> | React.ChangeEvent<HTMLInputElement>) => {
      const selectedDate = (e.target as HTMLInputElement).value;
      const date = new Date(selectedDate);
      setDisplayDate(date);
      setInputDisplayDate(dateToInputDisplayDate(date));

      const textDate = document.getElementById('text-date') as HTMLInputElement;
      if (textDate) textDate.value = date.toString();
    },
    [],
  );

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

  const toNewNote = useCallback(() => {
    localStorage.setItem('new-folder-edit', 'true');
  }, []);

  const themeBack = `${Theme.toLowerCase()}-back`;
  const themeHover = `${Theme.toLowerCase()}-hover`;

  const effectiveRadioType = useMemo(() => {
    let localRadioType = radioType;
    if (showTag === 'Log') {
      localRadioType = 'Log';
    }

    const wasEditing = localStorage.getItem('was-new-folder-edit');
    if (wasEditing) {
      localRadioType = 'Link';
    }

    return localRadioType;
  }, [radioType, showTag]);

  useEffect(() => {
    const wasEditing = localStorage.getItem('was-new-folder-edit');
    if (wasEditing) {
      setRadioType('Link');
      const timeout = setTimeout(() => {
        const el = document.getElementById('submit-new-note') as HTMLButtonElement;
        if (el) el.click();
        localStorage.removeItem('was-new-folder-edit');
      }, 100);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, []);

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

      {effectiveRadioType === 'Note' && <NewNoteField themeBack={themeBack} showTag={showTag ?? undefined} />}
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
      {effectiveRadioType === 'Link' && (
        <NewLinkField
          themeBack={themeBack}
          themeHover={themeHover}
          notes={allNotes}
          onChangeLink={changeLink}
          onNewFolder={toNewNote}
        />
      )}
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
