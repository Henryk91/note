import React, { Component } from 'react'

export default class NoteItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      item: this.props.item,
      editingItem: false,
    }
    this.deleteItem = this.deleteItem.bind(this)
  }

  deleteItem = (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to permanently delete this?")) {
      this.setState({ item: null })
      this.props.set({ oldItem: this.state.item, index: this.props.index , type: this.props.type , delete: true}) 
    }
  }

  editItem = () => {
    this.setState({ editingItem: true })
  }

  submitChange = (e) => {
    e.preventDefault();
    let update = e.target.item.value
    this.props.set({item: update, oldItem: this.state.item, index: this.props.index , type: this.props.type , delete: false}) 
    this.setState({ editingItem: false , item: update})
  }

  editItemBox(item) {

    return (
      <form onSubmit={this.submitChange} className="noteItemBox" id="noteItemEditBox">
        <input name="item" type="text" defaultValue={item}></input>
        <button type="submit">Submit</button>
        <button onClick={() => this.setState({ editingItem: false })}>Cancel</button>
      </form>
    )
  }

  displayItemBox(item){
    return (
      <div className="noteItemBox">
        <p className="noteItem">{item}</p>
        <button onClick={() => this.setState({ editingItem: true })}>Edit</button>
        <button  onClick={this.deleteItem}>Del</button>
        <br />
      </div>
    )
  }

  render() {
    const item = this.state.item
    let editing = this.state.editingItem
    return (
      <div key={item}>
        {item ? <div className="noteTagBox">{editing ? this.editItemBox(item) : this.displayItemBox(item)}</div> : null}
      </div>
    )
  }
}
