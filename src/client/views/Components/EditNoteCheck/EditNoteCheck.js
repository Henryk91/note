import React, { Component } from 'react';

export default class EditNoteCheck extends Component {
  constructor(props) {
    super(props);
    this.state = {
      radioType: 'Note'
    };
    this.setRadioType = this.setRadioType.bind(this);
  }
  setRadioType(type) {
    this.setState({ radioType: type });
  }

  render() {
    let radioType = this.state.radioType;
    const now = new Date();
    let showTag = this.props.showTag;
    console.log("AAAAAAAAAAAA",this.props)
    let themeBack = this.props.Theme.toLowerCase() + "-back";
    return (
      <div>
        <div className="radioBox">
          <label>Note</label>
          <label>Log</label>
          <label>Number</label>
          <label>Email </label>
          <br />
          <input onClick={() => this.setRadioType('Note')} type="radio" name="tagType" value="Note" defaultChecked />
          <input onClick={() => this.setRadioType('Log')} type="radio" name="tagType" value="Log" />
          <input onClick={() => this.setRadioType('Number')} type="radio" name="tagType" value="Number" />
          <input onClick={() => this.setRadioType('Email')} type="radio" name="tagType" value="Email" />
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
            <input className={themeBack} name="number" type="text" placeholder="Info" />
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
