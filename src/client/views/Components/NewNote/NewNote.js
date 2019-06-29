import React, { Component } from 'react'
import { EditNoteCheck } from '../index';

export default class NewNote extends Component {
  constructor(props) {
    super(props);
    this.state = {
      radioType: "Number"
    }
    this.addNewUser = this.addNewUser.bind(this)
    this.setRadioType = this.setRadioType.bind(this)
  }

  addNewUser = (event) => {
    event.preventDefault();
    let heading = event.target.heading.value
    // let lastName = event.target.lastName.value
    let number = event.target.number.value
    let tag = event.target.tagType.value

    tag === "Note" ? tag = event.target.tagTypeText.value : tag

    let uniqueId = docId();
    console.log(uniqueId)
    var note = {
      "id": uniqueId,
      "createdBy": "Unknown",
      "heading": heading,
      // "lastName": lastName,
      "dataLable": [{ "tag": tag, "data": number }]
    }
    this.setState({ showAddItem: false })
    this.props.set({ note })
  }

  setRadioType(type) {
    this.setState({ radioType: type })
  }

  render() {
    return (
      <form onSubmit={this.addNewUser}>
        <br />
        <input name="heading" type="text" placeholder="Heading" required="required"></input><br />
        {/* <input name="lastName" type="text" placeholder="last Name" required="required"></input><br /><br /> */}
        <EditNoteCheck />
          <button type="submit" >Submit</button>
      </form>
    )
  }
}

const docId = () => {
  let text = '';

  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 20; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}