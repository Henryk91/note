/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/prop-types */
import React, { Component } from 'react';

export default class EditNoteCheck extends Component {
  constructor(props) {
    super(props);
    this.state = {
      radioType: 'Note',
      upload: null
    };
    this.setRadioType = this.setRadioType.bind(this);
    this.handleChangeFile = this.handleChangeFile.bind(this);
  }

  setRadioType(type) {
    this.setState({ radioType: type });
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

  render() {
    let { radioType } = this.state;
    const { upload } = this.state;
    const now = new Date();
    const { showTag, Theme, lable } = this.props;

    let defaultNote = true;
    let defaultLog = false;
    if (showTag === 'Log') {
      radioType = 'Log';
      defaultLog = true;
      defaultNote = false;
    }
    const themeBack = `${Theme.toLowerCase()}-back`;
    // let lable = lable;
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
            <input className={themeBack} name="tagTypeText" type="text" defaultValue={now} />
            <br />
            {lable ? (
              <input className={themeBack} name="number" type="text" defaultValue={lable} />
            ) : (
              <input className={themeBack} name="number" type="text" placeholder="Info" />
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
