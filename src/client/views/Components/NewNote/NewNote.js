import React, { Component } from 'react';
import EditNoteCheck from '../EditNoteCheck/EditNoteCheck';
import { docId } from '../../Helpers/utils';

export default class NewNote extends Component {
  constructor(props) {
    super(props);
    this.addNewUser = this.addNewUser.bind(this);
  }

  addNewUser = (event) => {
    event.preventDefault();
    const isEditing = localStorage.getItem('new-folder-edit');
    const heading = (isEditing ? 'Sub: ' : '') + event.target.heading.value;
    let number = event.target.number.value;
    let tag = event.target.tagType.value;

    if (tag === 'Note') tag = event.target.tagTypeText.value;
    const loginKey = localStorage.getItem('loginKey');
    const uniqueId = docId();
    const textTag = event.target.tagTypeText.value;
    if (tag === 'Log') {
      number = JSON.stringify({ json: true, date: textTag, data: number });
    }

    const note = {
      id: uniqueId,
      userId: loginKey,
      createdBy: 'Unknown',
      heading,
      dataLable: [{ tag, data: number }],
    };

    const { set } = this.props;
    set({ note });
    window.history.back();
  };

  render() {
    const { Theme } = this.props;
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeHover = `${Theme.toLowerCase()}-hover`;

    setTimeout(() => {
      const el = document.getElementById('heading');
      if (el) el.focus();
    }, 100);

    return (
      <div>
        <button
          className={`backButton ${themeBack}`}
          onClick={() => {
            window.history.back();
          }}
        >
          <i className="fas fa-arrow-left" />
        </button>
        <form onSubmit={this.addNewUser}>
          <br />
          <input
            className={themeBack}
            name="heading"
            type="text"
            placeholder="Headings"
            required="required"
            id="heading"
          />
          <br />
          <EditNoteCheck Theme={Theme} />
          <button
            className={`submit-button ${themeHover} ${themeBack}`}
            type="submit"
          >
            {' '}
            <i className="fas fa-check" />
          </button>
        </form>
      </div>
    );
  }
}
