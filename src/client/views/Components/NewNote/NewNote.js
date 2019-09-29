/* eslint-disable no-unused-expressions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
/* eslint-disable no-plusplus */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { EditNoteCheck } from '../index';

const docId = () => {
  let text = '';

  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 20; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
export default class NewNote extends Component {
  constructor(props) {
    super(props);
    this.state = {

    };
    this.addNewUser = this.addNewUser.bind(this);
    this.setRadioType = this.setRadioType.bind(this);
  }

  addNewUser = (event) => {
    event.preventDefault();

    const heading = event.target.heading.value;
    const number = event.target.number.value;
    let tag = event.target.tagType.value;

    tag === 'Note' ? (tag = event.target.tagTypeText.value) : tag;
    const loginKey = localStorage.getItem('loginKey');
    const uniqueId = docId();
    console.log(uniqueId);
    const note = {
      id: uniqueId,
      userId: loginKey,
      createdBy: 'Unknown',
      heading,
      dataLable: [{ tag, data: number }]
    };
    this.props.set({ note });
  };


  render() {
    const { Theme } = this.props;
    return (
      <div>
        <Link className="backButton" style={{ textDecoration: 'none' }} to="/" title="Note List">
          <i className="fas fa-arrow-left" />
        </Link>
        <form onSubmit={this.addNewUser}>
          <br />
          <input className="red-back" name="heading" type="text" placeholder="Heading" required="required" />
          <br />
          <EditNoteCheck Theme={Theme} />
          <button className="submit-button red-back" type="submit">
            {' '}
            <i className="fas fa-check" />
          </button>
        </form>
      </div>
    );
  }
}
