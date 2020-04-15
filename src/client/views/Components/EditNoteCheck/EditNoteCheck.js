/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/prop-types */
import React, { Component } from 'react';

export default class EditNoteCheck extends Component {
  constructor(props) {
    super(props);
    this.state = {
      radioType: 'Note',
      upload: null,
      displayDate: new Date(),
      inputDisplayDate: new Date().toISOString().split('T')[0]
    };
    this.changeDate = this.changeDate.bind(this)
    this.setRadioType = this.setRadioType.bind(this);
    this.handleChangeFile = this.handleChangeFile.bind(this);
    this.onTodoChange = this.onTodoChange.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
    this.getText = this.getText.bind(this);
    this.getTextForFirefox = this.getTextForFirefox.bind(this);
  }

  setRadioType(type) {
    this.setState({ radioType: type });
  }

  changeDate = e => {
    e.preventDefault();
    const selectedDate = e.target.value;
    let date = new Date(selectedDate);
    this.setState({ displayDate: date, inputDisplayDate: date.toISOString().split('T')[0] });
    document.getElementById('text-date').value = date;
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

  onTextChange(ev) {
    var text = this.getText(ev.target);
    console.log("text",text)
    document.getElementById('input-div-text-area').value = text;
  }

  render() {
    let { radioType, displayDate, inputDisplayDate } = this.state;
    const { upload } = this.state;
    const { showTag, Theme, lable } = this.props;
    let defaultNote = true;
    let defaultLog = false;
    if (showTag === 'Log') {
      radioType = 'Log';
      defaultLog = true;
      defaultNote = false;
    }
    const themeBack = `${Theme.toLowerCase()}-back`;

    return (
      <div className="slide-in">
        <div className="radioBox">
          <label>Note</label>
          <label>Log</label>
          <label>Upload</label>
          <br />
          <input onClick={() => this.setRadioType('Note')} type="radio" name="tagType" value="Note" defaultChecked={defaultNote} />
          <input onClick={() => this.setRadioType('Log')} type="radio" name="tagType" value="Log" defaultChecked={defaultLog} />
          <input onClick={() => this.setRadioType('Upload')} type="radio" name="tagType" value="Upload" />
        </div>

        {radioType === 'Note' ? (
          <div>
            <input className={themeBack} name="tagTypeText" type="text" placeholder="Sub Heading" defaultValue={showTag} />
            <br />
            <textarea className={`editNoteTextarea ${themeBack}`} name="number" type="text" placeholder="eg: Company, Note" />
            <br />
          </div>
        ) : null}
        {radioType === 'Log' ? (
          <div>
            <input onChange={this.changeDate} value={inputDisplayDate} className={themeBack} type="date" name="dateSelector" />
            <br />
            <input id="text-date" className={themeBack} name="tagTypeText" type="text" defaultValue={displayDate} onChange={e => this.onTodoChange(e.target.value)}/>
            <br />
            {lable ? (
              <input className={themeBack} name="number" type="text" defaultValue={lable} />
            ) : (
              <div>
                <input id="input-div-text-area" className={themeBack} name="number" type="text" placeholder="Info" />
                <div id="div-text-area" contentEditable className={themeBack} onInput={ this.onTextChange } name="number" type="text" placeholder="Info" />
              </div>
            )}
            <br />
          </div>
        ) : null}
        {radioType === 'Upload' ? (
          <div>
            <input className={themeBack} name="tagTypeText" type="text" placeholder="Sub Heading" defaultValue={showTag} />
            <br />
            <input onChange={e => this.handleChangeFile(e)} className={themeBack} name="upload" type="file" />
            {upload !== null ? (
              <input style={{ visibility: 'hidden', height: '0px', width: '0px' }} name="number" type="text" defaultValue={upload} />
            ) : null}
            <br />
          </div>
        ) : null}
        {radioType === 'Number' ? (
          <div>
            <input className={themeBack} name="number" type="number" placeholder="Add Number" />
            <br />
            <br />
          </div>
        ) : null}
        {radioType === 'Email' ? (
          <div>
            {' '}
            <input className={themeBack} name="number" type="email" placeholder="Add Email" />
            <br />
            <br />
          </div>
        ) : null}
      </div>
    );
  }
}
