import React, { Component } from 'react'
import { Link } from 'react-router-dom';
import { EditNoteCheck } from '../index';
import { NoteItem } from '../index'
export default class NoteDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      person: null,
      showAddItem: false,
      editName: false,
      number: null,
      email: null,
      tags: null
    }
    this.addItem = this.addItem.bind(this)
    this.submitNewItem = this.submitNewItem.bind(this)
    this.getNoteByTag = this.getNoteByTag.bind(this)
    this.editNameBox = this.editNameBox.bind(this)
  }

  componentDidMount() {
    let person = null
    if (this.props.match) {
      person = getPerson(this.props.notes, this.props.match)
      this.refreshItems(person)
    }
  }

  refreshItems = (person) => {
    if (person) {
      let tags = this.getNoteByTag(person.dataLable)
      this.setState({ person, tags })
    }
  }

  submitNewItem = (event) => {
    event.preventDefault();
    let person = this.state.person
    let number = event.target.number.value
    let tag = event.target.tagType.value

    tag === "Other" ? tag = event.target.tagTypeText.value : tag

    person.dataLable.push({ tag: tag, data: number })
    this.props.set({ person })
    console.log(event.target.number.value)

    this.refreshItems(person)
    this.setState({ showAddItem: false })
  }

  addItem() {
    return (
      <form onSubmit={this.submitNewItem}>
        <EditNoteCheck />
        <button type="submit">Add</button>
        <button onClick={() => this.setState({ showAddItem: false })}>Cancel</button>
      </form>
    )
  }

  updateNoteItem = (val) => {

    let person = this.state.person
    let index = person.dataLable.findIndex((item) => item.tag === val.type && item.data === val.oldItem)
    if (!val.delete) {
      person.dataLable[index].data = val.item
    } else {
      person.dataLable.splice(index, 1)
    }
    this.props.set({ person })
  }

  submitNameChange = (e) => {
    e.preventDefault();
    let heading = e.target.heading.value
    // let lastName = e.target.lastName.value

    let person = this.state.person
    person.heading = heading;
    // person.lastName = lastName;

    this.setState({ person, editName: false })
    this.props.set({ person })
  }

  editNameBox(heading) {
    return (
      <form onSubmit={this.submitNameChange}>
        <input name="heading" type="text" defaultValue={heading}></input><br />
        {/* <input name="lastName" type="text" defaultValue={lastName}></input><br /> */}
        <button type="submit">Submit</button>
        <button onClick={() => this.setState({ editName: false })}>Cancel</button>
      </form>
    )
  }

  getNoteByTag = (items) => {
    let sort = {}
    items.forEach((tag) => {
      sort[tag.tag] ? sort[tag.tag].push(tag.data) : sort[tag.tag] = [tag.data]
      console.log(tag.tag)
    })

    let propertyArray = Object.keys(sort);
    let all = propertyArray.map((prop, i) => {

      let bunch = sort[prop].map((item, ind) => {
        return (
          <NoteItem key={item + prop} item={item} set={this.updateNoteItem} type={prop} index={ind} />
        )
      })
      return (
        <div className="detailedBox" key={prop + i}>
          <h3>{prop}:</h3>
          {bunch}
        </div>
      )
    })
    return all
  }
  render() {
    let person = this.state.person
    const showAddItem = this.state.showAddItem
    let tags = this.state.tags
    let editName = this.state.editName
    let editNameB = null;

    person ? editNameB = this.editNameBox(person.heading) : editNameB = null

    return (
      <div >
        <Link id="detailBackButton" to="/" title="Note List">Back</Link>
        {person ?
          <div key={person.id}>

            {editName ?
              <div>{editNameB}</div> :
              <div >
                <h1>{person.heading}</h1>
                <button
                  className="detailEditBoxButton"
                  onClick={() => this.setState({ editName: true })}>
                  Edit Name
                </button>
              </div>
            }
            <button
              className="detailEditBoxButton"
              onClick={() => this.setState({ showAddItem: true })}>
              Add Item
            </button>
            {showAddItem ? <div> {this.addItem()}</div> : null}

            {tags ? <div> {tags} <br /></div> : null}
          </div> :
          null
        }
      
      </div>
    )
  }
}

const getPerson = (notes, propForId) => {
  return notes ? notes.filter((val) => val.id == propForId.params.id)[0] : null
}