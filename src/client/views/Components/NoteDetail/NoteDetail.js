import React, { Component } from 'react'
import { Link } from 'react-router-dom';
import { EditNoteCheck } from '../index';
import { NoteItem } from '../index'
export default class NoteDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      person: null,
      showItem: false,
      showAddItem: false,
      editName: false,
      number: null,
      email: null,
      tags: null,
      showTag: '',
      displayDate: null,
    }
    this.addItem = this.addItem.bind(this)
    this.submitNewItem = this.submitNewItem.bind(this)
    this.getNoteByTag = this.getNoteByTag.bind(this)
    this.editNameBox = this.editNameBox.bind(this)
    this.showTagChange = this.showTagChange.bind(this)
    this.showHideBox = this.showHideBox.bind(this)
    this.showNoteNames = this.showNoteNames.bind(this)
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
    
    let textTag = event.target.tagTypeText.value 
    
    tag === "Note" ? tag = textTag : tag

    if(tag === "Log"){
      
      let date = new Date(textTag);
      var month = new Array();
      month[0] = "January";
      month[1] = "February";
      month[2] = "March";
      month[3] = "April";
      month[4] = "May";
      month[5] = "June";
      month[6] = "July";
      month[7] = "August";
      month[8] = "September";
      month[9] = "October";
      month[10] = "November";
      month[11] = "December";
      var n = month[date.getMonth()];
      
      // tag = (date.getMonth()+1) + " " + n;
      
      number = JSON.stringify({ json : true,  date : textTag , data: number })
    } 
    
    person.dataLable.push({ tag: tag, data: number })
    this.props.set({ person })

    this.refreshItems(person)
    this.setState({ showAddItem: false })
  }

  addItem() {
    return (
      <form  onSubmit={this.submitNewItem}>
        <EditNoteCheck showTag={this.state.showTag} />
        <br/>
        <button type="submit">Add</button>
        <button onClick={() => this.setState({ showAddItem: false })}> Cancel </button>
        <br />
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

    this.setState({ person, editName: false })
    this.props.set({ person })
  }
  
  changeDate = (e) => {
    e.preventDefault();
    let selectedDate = e.target.dateSelector.value
    
    if(!selectedDate) selectedDate = new Date()

    this.setState({displayDate : selectedDate})
  }

  editNameBox(heading) {
    return (
      <form onSubmit={this.submitNameChange}>
        <br />
        <input className="changeNameHeading" name="heading" type="text" defaultValue={heading}></input>
        <br />
        <br />
        <button type="submit">Submit</button>
        <button onClick={() => this.setState({ editName: false })}>Cancel</button>
        <br />
        <br />
      </form>
    )
  }

  showTagChange = (tagName) => {
    let person = this.state.person;
    this.setState({ showTag: tagName})
    let tags = this.getNoteByTag(person.dataLable, tagName)
      this.setState({ person, tags })
  }
  
  showNoteNames = (names) => {
  
  return names.map((name) => {
    return (
      <Link style={{ textDecoration: 'none' }} to="/" title="Note List" >
      <div className="listNameButton" key={name} onClick={() => this.props.set({ noteName: name })}>      
          <h3> { name } </h3>   
      </div> 
        </Link>
    )
  })
}
  
  showHideBox = (showTag , prop) => {
    
      if (showTag !== prop && prop !== 'Log') {
        this.showTagChange(prop)
      } else if(showTag !== '' && prop !== 'Log') {
        this.showTagChange('')
      }
    }
  
  getNoteByTag = (items, showTag) => {
    let showItem = this.state.showItem
    let sort = {}
    items.forEach((tag) => {
      sort[tag.tag] ? sort[tag.tag].push(tag.data) : sort[tag.tag] = [tag.data]
    })
    
    

    let propertyArray = Object.keys(sort).sort();
    let all = propertyArray.map((prop, i) => {
      
      let showButton = false;
      let showDateSelector = false
      
      if(prop === 'Log') showDateSelector = true
      
      let stateShowTag = this.state.showTag;
      let selectedDate = this.state.displayDate
      
      if(showTag === prop){
        showButton = true
      }
      
      let bunch = sort[prop].map((item, ind) => {
        return (
              <div >
                <NoteItem key={item + prop} item={item} date={selectedDate} show={showButton} set={this.updateNoteItem} type={prop} index={ind} />
              </div>
              )
      })
      return (
        <div  className="detailedBox" key={prop + i} onClick={() => showTag !== prop && prop !== 'Log'  ? this.showTagChange(prop): null}>
          <div className="detailTitleBox" onClick={() => this.showHideBox(showTag,prop)}>
          <h3 className="detailBoxTitle">{prop}:</h3> 
            
          
            {showDateSelector ?
            <form className="detailBoxTitle dateSelector" onSubmit={this.changeDate}>
              <input  type="date" name="dateSelector" /> 
              <button type="submit">Select</button>
            </form>:
            ''
          }
          { prop !== 'Log'? 
          <div> 
                <button className="detailBoxTitleButton" onClick={() => {window.scrollTo(0, 0), this.setState({ showAddItem: true })}}> 
                  Add </button> 
              </div> 
            : null
          }
          {
            showTag === 'Log'?
              <div> 
                <button className="detailBoxTitleButton" onClick={() => this.showTagChange('')}> 
                  Hide </button> 
              </div>:
              prop === 'Log' ? 
              <div> 
                <button className="detailBoxTitleButton" onClick={() => this.showTagChange(prop)}> 
                  Show </button> 
              </div>
              : null
          }
            </div>
          
            { bunch }
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
    
    
    const isNoteNames = this.props.match.url === '/notes/note-names'
     let noteNameBlock = isNoteNames ? this.showNoteNames(this.props.noteNames) : null
    return (
      <div >
        <Link id="detailBackButton" to="/" title="Note List" >Back</Link>
        { isNoteNames ? <div> <br /> { noteNameBlock } </div> : null }
        {person ?
          <div key={person.id}>

            {editName ?
              <div>{editNameB}</div> :
              <div >
                <h1 >{person.heading}</h1>
              {showAddItem ? '':
                <button
                  className="detailEditBoxButton"
                  onClick={() => this.setState({ editName: true })}>
                  Edit Name
                </button>
              }
              { editName ? '':
            <button
              className="detailEditBoxButton"
              onClick={() => showAddItem ? this.setState({ showAddItem: false }) : this.setState({ showAddItem: true })}>
              Add Item
            </button>
            }
              <br />
              </div>
            }
            {showAddItem ? <div> {this.addItem()}</div> : null}
            {tags ? <div> {tags} </div> : null}
            <br />
          </div> :
          null
        }
      
      </div>
    )
  }
}



const getPerson = (notes, propForId) => {
  
  if(propForId === "note-name") {
    console.log("NoteName")
    
    return this.props.noteNames
  }
  console.log(notes ? notes.filter((val) => val.id == propForId.params.id)[0] : null)
  
  return notes ? notes.filter((val) => val.id == propForId.params.id)[0] : null
}