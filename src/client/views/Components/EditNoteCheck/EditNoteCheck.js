import React, { Component } from 'react';

export default class EditNoteCheck extends Component {
    constructor(props) {
      super(props);
      this.state = {
        radioType: "Note"
      }
      this.setRadioType = this.setRadioType.bind(this)
    }
    setRadioType(type) {
      this.setState({ radioType: type })
    }
  
    render() {
      let radioType = this.state.radioType
      return (

        <div>
          <div className="radioBox">
            <label>Note</label>
            <label>Number</label>
            <label>Email </label><br />
            <input onClick={() => this.setRadioType("Note")} type="radio" name="tagType" value="Note" defaultChecked/>
            <input onClick={() => this.setRadioType("Number")} type="radio" name="tagType" value="Number" />
            <input onClick={() => this.setRadioType("Email")} type="radio" name="tagType" value="Email" />
          </div>
  
          {radioType === "Note" ?
            <div>
              <input name="tagTypeText" type="text" placeholder="Sub Heading" /><br />
              <input name="number" type="text" placeholder="eg: Company, Note"></input>
              <br /></div> :
            null
          }
          {radioType === "Number" ?
            <div>
              <input name="number" type="number" placeholder="Add Number"></input>
              <br /><br /></div> :
            null
          }
          {radioType === "Email" ?
            <div> <input name="number" type="email" placeholder="Add Email"></input>
              <br /><br /></div> :
            null
          }
        </div>
      )
    }
  }
  
