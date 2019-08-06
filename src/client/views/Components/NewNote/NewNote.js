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
    let heading = event.target.heading.value;
    // let lastName = event.target.lastName.value
    let number = event.target.number.value;
    let tag = event.target.tagType.value;

    tag === 'Note' ? (tag = event.target.tagTypeText.value) : tag;
    let loginKey = localStorage.getItem('loginKey');
    let uniqueId = docId();
    console.log(uniqueId);
    let note = {
      id: uniqueId,
      userId: loginKey,
      createdBy: 'Unknown',
      heading: heading,
      dataLable: [{ tag: tag, data: number }]
    };
    this.setState({ showAddItem: false });
    this.props.set({ note });
  };

  setRadioType(type) {
    this.setState({ radioType: type });
  }

  render() {
    return (
      <div>
        <Link className="backButton" style={{ textDecoration: 'none' }} to="/" title="Note List">
          <i className="fas fa-arrow-left" />
        </Link>
        <form onSubmit={this.addNewUser}>
          <br />
          <input className="red-back" name="heading" type="text" placeholder="Heading" required="required" />
          <br />
          <EditNoteCheck Theme={this.props.Theme} />
          <button className="submit-button red-back" type="submit"> <i className="fas fa-check" /></button>
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
