/* eslint-disable no-plusplus */
/* eslint-disable react/sort-comp */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-expressions */
/* eslint-disable import/order */
/* eslint-disable react/prop-types */
/* eslint-disable arrow-parens */
/* eslint-disable react/destructuring-assignment */
import React, { Component } from 'react';
import { EditNoteCheck } from '../index';
import { Link } from 'react-router-dom';

export default class NewNote extends Component {
  constructor(props) {
    super(props);
    this.state = {
      radioType: 'Number'
    };
    this.addNewUser = this.addNewUser.bind(this);
    this.setRadioType = this.setRadioType.bind(this);
  }

  addNewUser = event => {
    event.preventDefault();
    const heading = event.target.heading.value;
    let number = event.target.number.value;
    let tag = event.target.tagType.value;

    tag === 'Note' ? (tag = event.target.tagTypeText.value) : tag;
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
      dataLable: [{ tag, data: number }]
    };
    this.setState({ showAddItem: false });
    this.props.set({ note });
    window.history.back()
  };

  setRadioType(type) {
    this.setState({ radioType: type });
  }

  render() {
    const { Theme } = this.props
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeHover = `${Theme.toLowerCase()}-hover`;
    
    return (
      <div>
        <Link className="backButton" style={{ textDecoration: 'none' }} to="/" title="Note List">
          <i className="fas fa-arrow-left" />
        </Link>
        <form onSubmit={this.addNewUser}>
          <br />
          <input className={themeBack}  name="heading" type="text" placeholder="Heading" required="required" />
          <br />
          <EditNoteCheck Theme={this.props.Theme} />
          <button className={`submit-button ${themeHover} ${themeBack}`} type="submit">
            {' '}
            <i className="fas fa-check" />
          </button>
        </form>
      </div>
    );
  }
}

const docId = () => {
  let text = '';

  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 20; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
