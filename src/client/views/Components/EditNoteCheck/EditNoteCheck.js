/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/prop-types */
import React, { Component, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


export default class EditNoteCheck extends Component {
  constructor(props) {
    super(props);
    this.state = {
      radioType: 'Note',
      upload: null,
      displayDate: new Date(),
      inputDisplayDate: this.dateToInputDisplayDate(new Date())
    };
    this.changeDate = this.changeDate.bind(this)
    this.setRadioType = this.setRadioType.bind(this);
    this.handleChangeFile = this.handleChangeFile.bind(this);
    this.onTodoChange = this.onTodoChange.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
    this.getText = this.getText.bind(this);
    this.getTextForFirefox = this.getTextForFirefox.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  setRadioType(type) {
    this.setState({ radioType: type });
  }

  changeDate = e => {
    e.preventDefault();
    const selectedDate = e.target.value;
    let date = new Date(selectedDate);
    this.setState({ displayDate: date, inputDisplayDate: this.dateToInputDisplayDate(date) });
    document.getElementById('text-date').value = date;
  };

  dateToInputDisplayDate = (date) => {
    if (!date || isNaN(date)) return ''
    let minutes = this.addLeadingZero(date.getMinutes())
    let hours = this.addLeadingZero(date.getHours())
    return date.toISOString().split('T')[0] + "T" + hours + ":" + minutes
  }

  addLeadingZero = (number) => {
    if(number < 10) number = "0" + number
    return number
  }
  
  changeLink = e => {
    e.preventDefault();
    const { allNotes } = this.props;
    const headings = this.getAllNoteHeadingsWithIds(allNotes);
    const selected = headings.find(heading => heading.id === e.target.value)
    document.getElementById('link-text').value = selected.heading;
  };

  onTodoChange = (value) => {
    this.setState({ displayDate: value });
  }

  handleChangeFile = event => {
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.setState({ upload: reader.result.toString() });
      };
    }
  };
  getText(el) {
    return el.innerText || this.getTextForFirefox(el);
  }
  getTextForFirefox(el) {
    // Taken from http://stackoverflow.com/a/3908094
    var text = "";
    if (typeof window.getSelection != "undefined") {
      var sel = window.getSelection();
      var tempRange = sel.getRangeAt(0);
      sel.removeAllRanges();
      var range = document.createRange();
      range.selectNodeContents(el);
      sel.addRange(range);
      text = sel.toString();
      sel.removeAllRanges();
      sel.addRange(tempRange);
    }

    return text;
  }

  onTextChange(value) {
    let input = `${value}`;
    input = input.replaceAll("%3A", ":")
    input = input.replaceAll("%20", " ")
    input = input.replaceAll("%0A", "\n")

    const element = document.getElementById('dynamic-text-area')
    if(input.length > 17) {
      element.classList.remove('small-text-area');  
      element.classList.add('big-text-area');  
    } else {
      element.classList.add('small-text-area');  
      element.classList.remove('big-text-area');
    }

    if(input !== value)element.value = input;
  }

  handleChange(event) {
    let input = event.target.value;
    if(input.length > 17) {
      let divTextArea = document.getElementById('div-text-area');
      divTextArea.textContent = input;
      divTextArea.classList.remove('hidden');  
      document.getElementById('input-div-text-area').classList.add('hidden');  
      divTextArea.focus();
      // Move cursor to end of line
      document.execCommand('selectAll', false, null);
      document.getSelection().collapseToEnd();
    }
  }

  render() {
    let { radioType, displayDate, inputDisplayDate } = this.state;
    const { upload } = this.state;
    const { showTag, Theme, lable, allNotes } = this.props;
    let defaultNote = true;
    let defaultLog = false;
    let defaultLink = false;
    if (showTag === 'Log') {
      radioType = 'Log';
      defaultLog = true;
      defaultNote = false;
    }
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeHover = `${Theme.toLowerCase()}-hover`;

    const wasEditing = localStorage.getItem('was-new-folder-edit');
    if(wasEditing){
      radioType = 'Link';
      defaultLink = true;
      defaultLog = false;
      defaultNote = false;
      setTimeout(() => {
        const el = document.getElementById('submit-new-note');
        if(el) el.click();
        localStorage.removeItem('was-new-folder-edit')
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
          <input onClick={() => this.setRadioType('Note')} type="radio" name="tagType" value="Note" defaultChecked={defaultNote} />
          <input onClick={() => this.setRadioType('Log')} type="radio" name="tagType" value="Log" defaultChecked={defaultLog} />
          <input onClick={() => this.setRadioType('Link')} type="radio" name="tagType" value="Link" id="linkRadio" defaultChecked={defaultLink}/>
          <input onClick={() => this.setRadioType('Upload')} type="radio" name="tagType" value="Upload" />
        </div>

        {radioType === 'Note' ? (
          this.newNote(themeBack, showTag)
        ) : null}
        {radioType === 'Log' ? (
          this.newLog(inputDisplayDate, themeBack, displayDate, lable)
        ) : null}
        {radioType === 'Link' ? (
          this.newLink(themeBack, themeHover, allNotes)
        ) : null}
        {radioType === 'Upload' ? (
          this.newUpload(themeBack, showTag, upload)
        ) : null}
        {radioType === 'Number' ? (
          this.newNumber(themeBack)
        ) : null}
        {radioType === 'Email' ? (
          this.newEmail(themeBack)
        ) : null}
      </div>
    );
  }

  newUpload(themeBack, showTag, upload) {
    return <div>
      <input className={themeBack} name="tagTypeText" type="text" placeholder="Sub Heading" defaultValue={showTag} />
      <br />
      <input onChange={e => this.handleChangeFile(e)} className={themeBack} name="upload" type="file" />
      {upload !== null ? (
        <input style={{ visibility: 'hidden', height: '0px', width: '0px' }} name="number" type="text" defaultValue={upload} />
      ) : null}
      <br />
    </div>;
  }
  getAllNoteHeadingsWithIds(notes){
    if(notes === undefined) return []
    return notes.map(note => {
      return {
        heading: note.heading,
        id: note.id
      }
    })
  }

  toNewNote(){
    localStorage.setItem('new-folder-edit',true)
  }
  newLink(themeBack, themeHover, notes) {
    const headings = this.getAllNoteHeadingsWithIds(notes);
    let defaultId = null;
    const options = headings.map((item, index) => {
      if(index === (headings.length -1)) defaultId = item.id
      return <option key={index} value={item.id}>{item.heading}</option>
    });
    const defaultVal = headings && headings.length ? (headings[headings.length -1].heading).replace('Sub: ',''): ''
    return <div>
      <br />
      <Link style={{ textDecoration: 'none', color: 'white' }} className={`${themeHover} ${themeBack}`} to="/new-note/" onClick={this.toNewNote}>
          New Folder
      </Link>
      <br />
      <select onChange={this.changeLink} className={themeBack} name="number" id="links" defaultValue={defaultId}>
        {options}
      </select>
      <br />
      <input id="link-text" className={themeBack} name="tagTypeText" type="text" defaultValue={defaultVal}/>
      <br />
    </div>;
  }

  newEmail(themeBack) {
    return <div>
      {' '}
      <input className={themeBack} name="number" type="email" placeholder="Add Email" />
      <br />
      <br />
    </div>;
  }

  newNumber(themeBack) {
    return <div>
      <input className={themeBack} name="number" type="number" placeholder="Add Number" />
      <br />
      <br />
    </div>;
  }

  newLog(inputDisplayDate, themeBack, displayDate, lable) {
    return <div>
      <input onChange={this.changeDate} value={inputDisplayDate} className={themeBack} type="datetime-local" name="dateSelector" />
      <br />
      <input id="text-date" className={themeBack} name="tagTypeText" type="text" defaultValue={displayDate} onChange={e => this.onTodoChange(e.target.value)} />
      <br />
      {lable ? (
        <input className={themeBack} name="number" type="text" defaultValue={lable} />
      ) : (
        <AutoCompleteTextArea 
          elementId={"dynamic-text-area"} 
          className={`${themeBack}`} 
          smallClassName={'small-text-area'} 
          bigClassName={'big-text-area'}
          placeholder="Info"
          name="number"
        /> 
        )}
      <br />
    </div>;
  }

  newNote(themeBack, showTag) {
    const creatingNewFolder = localStorage.getItem('new-folder-edit');
    let defaultVal = '';
    if(creatingNewFolder) {
      showTag = 'Note'
      defaultVal = '1.'
    }
    return <div>
      <input className={themeBack} name="tagTypeText" type="text" placeholder="Sub Heading" defaultValue={showTag} />
      <br />
      <AutoCompleteTextArea 
        elementId={"dynamic-text-area-a"} 
        className={`${themeBack}`} 
        smallClassName={'input-div-text-area'} 
        bigClassName={'div-text-area'}
        placeholder="eg: Company, Note" 
        defaultValue={defaultVal}
        name="number"
      /> 
      <br />
    </div>;
  }
}

function AutoCompleteTextArea(
  {
    elementId,
    className,
    smallClassName,
    bigClassName, 
    onChange,
    placeholder,
    defaultValue,
    name
  }
  ) {
  const [doReload, setDoReload] = useState(false)
  const [isBig, setIsBig] = useState()
  const [value, setValue] = useState()

  const localChange = (event) => {
    let input = event.target.value;

    input = input.replaceAll("%3A", ":")
    input = input.replaceAll("%20", " ")
    input = input.replaceAll("%0A", "\n")

    if(input.length > 17) {
      if(!isBig) {
        setIsBig(true)
        setDoReload(!doReload)
      }
    } else {
      if(isBig) {
        setIsBig(false)
        setDoReload(!doReload)
      }
    }

    setValue(input)

    if(input !== event.target.value){
      const element = document.getElementById(elementId)
      element.value = input;
    }
    if(onChange) onChange(input)
  }
  const pasteListener = () => {
    const el = document.getElementById(elementId)
    el.addEventListener("paste", async (event) => {
      if (isBig) return
      event.preventDefault()
      const text = await navigator.clipboard.readText();
      const element = document.getElementById(elementId);
      setTimeout(() => {
        // const value = element.value.length < 17? element.value + text: text;
        const value = element.value + text;
        setValue(value);
        setIsBig(value.length > 17);
        setDoReload(!doReload);
      },  10);
    })
  }
  
  useEffect(() => {
    if(value){
      const element = document.getElementById(elementId)
      element.value = value;
      element.focus()
    }
    pasteListener();
  },[doReload])

  return isBig?(
    <textarea id={elementId} className={`${className} ${bigClassName}`} onChange={localChange} name={name} type="text" placeholder={placeholder} defaultValue={defaultValue}/>
  ):(
    <input id={elementId} className={`${className} ${smallClassName}`} onChange={localChange} name={name} type="text" placeholder={placeholder} defaultValue={defaultValue} />
  )
}

