import React, { Component, useEffect, useState } from 'react';
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

type EditNoteCheckState = {
  radioType: string;
  upload: string | null;
  displayDate: Date | null;
  inputDisplayDate: string;
};

export default class EditNoteCheck extends Component<EditNoteCheckProps, EditNoteCheckState> {
  constructor(props: EditNoteCheckProps) {
    super(props);
    this.state = {
      radioType: 'Note',
      upload: null,
      displayDate: new Date(),
      inputDisplayDate: this.dateToInputDisplayDate(new Date()),
    };
    this.changeDate = this.changeDate.bind(this);
    this.setRadioType = this.setRadioType.bind(this);
    this.handleChangeFile = this.handleChangeFile.bind(this);
    this.onTodoChange = this.onTodoChange.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
    this.getText = this.getText.bind(this);
    this.getTextForFirefox = this.getTextForFirefox.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChangeFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.setState({ upload: reader?.result?.toString() || null });
      };
    }
  };

  handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target.value;
    if (input.length > 17) {
      const divTextArea = document.getElementById('div-text-area');
      if (divTextArea) {
        divTextArea.textContent = input;
        divTextArea.classList.remove('hidden');
        document.getElementById('input-div-text-area')?.classList.add('hidden');
        divTextArea.focus();
      }
      document.execCommand('selectAll', false, undefined);
      document.getSelection()?.collapseToEnd();
    }
  }

  onTodoChange = (value: string) => {
    this.setState({ displayDate: new Date(value) });
  };

  onTextChange(value: string) {
    let input = `${value}`;
    input = input.replaceAll('%3A', ':');
    input = input.replaceAll('%20', ' ');
    input = input.replaceAll('%0A', '\n');

    const element = document.getElementById('dynamic-text-area') as HTMLInputElement;
    if (!element) return;
    if (input.length > 17) {
      element.classList.remove('small-text-area');
      element.classList.add('big-text-area');
    } else {
      element.classList.add('small-text-area');
      element.classList.remove('big-text-area');
    }

    if (input !== value) element.value = input;
  }

  getTextForFirefox(el: HTMLElement) {
    let text = '';
    if (typeof window.getSelection !== 'undefined') {
      const sel = window.getSelection();
      if (!sel) return text;
      const tempRange = sel.getRangeAt(0);
      sel.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.addRange(range);
      text = sel.toString();
      sel.removeAllRanges();
      sel.addRange(tempRange);
    }

    return text;
  }

  getText(el: HTMLElement) {
    return el.innerText || this.getTextForFirefox(el);
  }

  setRadioType(type: string) {
    this.setState({ radioType: type });
  }

  getAllNoteHeadingsWithIds(notes?: Note[] | null) {
    if (notes === undefined || notes === null) return [];
    return notes.map((note) => ({
      heading: note.heading,
      id: note.id,
    }));
  }

  changeLink = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    const { allNotes } = this.props;
    const headings = this.getAllNoteHeadingsWithIds(allNotes);
    const selected = headings.find((heading) => heading.id === e.target.value);
    const linkElement = document.getElementById('link-text') as HTMLInputElement;
    if (linkElement && selected) linkElement.value = selected.heading;
  };

  addLeadingZero = (number: number) => {
    if (number < 10) return `0${number}`;
    return number;
  };

  dateToInputDisplayDate = (date: Date) => {
    if (!date || Number.isNaN(date.getTime())) return '';
    const minutes = this.addLeadingZero(date.getMinutes());
    const hours = this.addLeadingZero(date.getHours());
    return `${date.toISOString().split('T')[0]}T${hours}:${minutes}`;
  };

  changeDate = (e: React.FormEvent<HTMLFormElement> | React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = (e.target as HTMLInputElement).value;
    const date = new Date(selectedDate);
    this.setState({
      displayDate: date,
      inputDisplayDate: this.dateToInputDisplayDate(date),
    });

    const textDate = document.getElementById('text-date') as HTMLInputElement;
    if (textDate) textDate.value = date.toString();
  };

  toNewNote = () => {
    localStorage.setItem('new-folder-edit', 'true');
  };

  render() {
    const { radioType, displayDate, inputDisplayDate, upload } = this.state;
    let localRadioType = radioType;
    const { showTag, Theme, lable, allNotes } = this.props;

    let defaultNote = true;
    let defaultLog = false;
    let defaultLink = false;
    if (showTag === 'Log') {
      localRadioType = 'Log';
      defaultLog = true;
      defaultNote = false;
    }
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeHover = `${Theme.toLowerCase()}-hover`;

    const wasEditing = localStorage.getItem('was-new-folder-edit');
    if (wasEditing) {
      localRadioType = 'Link';
      defaultLink = true;
      defaultLog = false;
      defaultNote = false;
      setTimeout(() => {
        const el = document.getElementById('submit-new-note') as HTMLButtonElement;
        if (el) el.click();
        localStorage.removeItem('was-new-folder-edit');
      }, 100);
    }

    return (
      <div className="slide-in1">
        <div className="radioBox">
          <label>Note</label>
          <label>Log</label>
          <label>Link</label>
          <label>Upload</label>
          <br />
          <input
            onClick={() => this.setRadioType('Note')}
            type="radio"
            name="tagType"
            value="Note"
            defaultChecked={defaultNote}
          />
          <input
            onClick={() => this.setRadioType('Log')}
            type="radio"
            name="tagType"
            value="Log"
            defaultChecked={defaultLog}
          />
          <input
            onClick={() => this.setRadioType('Link')}
            type="radio"
            name="tagType"
            value="Link"
            id="linkRadio"
            defaultChecked={defaultLink}
          />
          <input
            onClick={() => this.setRadioType('Upload')}
            type="radio"
            name="tagType"
            value="Upload"
          />
        </div>

        {localRadioType === 'Note' && <NewNoteField themeBack={themeBack} showTag={showTag ?? undefined} />}
        {localRadioType === 'Log' && (
          <NewLogField
            inputDisplayDate={inputDisplayDate}
            themeBack={themeBack}
            displayDate={displayDate}
            lable={lable}
            onChangeDate={this.changeDate}
            onTodoChange={(val) => this.onTodoChange(val)}
          />
        )}
        {localRadioType === 'Link' && (
          <NewLinkField
            themeBack={themeBack}
            themeHover={themeHover}
            notes={allNotes}
            onChangeLink={this.changeLink}
            onNewFolder={this.toNewNote}
          />
        )}
        {localRadioType === 'Upload' && (
          <NewUploadField
            themeBack={themeBack}
            showTag={showTag ?? undefined}
            upload={upload}
            onFileChange={this.handleChangeFile}
          />
        )}
        {localRadioType === 'Number' && <NewNumberField themeBack={themeBack} />}
        {localRadioType === 'Email' && <NewEmailField themeBack={themeBack} />}
      </div>
    );
  }
}

