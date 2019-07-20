import React, { Component } from 'react'
import marked from 'marked';

marked.setOptions({
  breaks: true,
});

export default class NoteItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      item: this.props.item,
      editingItem: false,
    }
    this.deleteItem = this.deleteItem.bind(this)
    this.getMarkdownText = this.getMarkdownText.bind(this);
  }
  
  deleteItem = (e) => {
    e.preventDefault();
    console.log(this.state.item)
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
  
   getMarkdownText(input) {
    let rawMarkup = marked(input,  {sanitize: true});
    return { __html: rawMarkup };
  }

  editItemBox(item) {

    return (
      <form onSubmit={this.submitChange} className="noteItemBox" className="noteItemEditBox">
        <textarea className="editTextarea" name="item" type="text" defaultValue={item} />
        <br />
        <button type="submit">Submit</button>
        <button onClick={() => this.setState({ editingItem: false })}>Cancel</button>
        <button onClick={this.deleteItem}> Delete</button>
        <hr />
        <br />
      </form>
    )
  }

  getMarkdownText(item) {
    let rawMarkup = marked(item,  {sanitize: true});
    return { __html: rawMarkup };
  }

  displayItemBox(item){
    return (
      <div className="noteItemBox">
        {this.props.show ? 
          <div>
                <div className="noteItem" dangerouslySetInnerHTML={this.getMarkdownText(item)} />
                <button className="editButtons" onClick={() => this.setState({ editingItem: true })}>
                  Edit
                </button>
            <hr />
            </div>
        : ''}
      </div>
    )
  }

  displayLogItemBox(item){
    item = JSON.parse(item)
    
    let showItem = this.props.show
    let date = item.date.substring(0, item.date.indexOf("GMT")).trim()
    let selectedDate = this.props.date
    if(selectedDate) {
      
      selectedDate = new Date(selectedDate)+""
      selectedDate = selectedDate.substring(0,16)
      console.log(selectedDate)
      if(showItem && !date.includes(selectedDate)){
         showItem = false;
      }
    }
    return (
      <div className="noteItemBox">
        {showItem ? 
          <div>
              <div >
                <p className="noteItem dateHeading"> { date } </p>
                <p className="noteItem"> { item.data } </p>
                <button className="editButtons" onClick={() => this.setState({ editingItem: true })}>
                  Edit
                </button>
              </div>
            <hr />
            </div>
        : ''}
      </div>
    )
  }

  render() {
    const item = this.state.item
    let editing = this.state.editingItem
    let isLog = false
    
    if(item) isLog = item.includes("json")
    if(editing){
      if(!this.props.show) this.setState({editingItem: false})
      editing = this.props.show;
    }
    return (
      <div key={item}>
        {item ? 
          <div className="noteTagBox">
            {editing ? this.editItemBox(item): 
            isLog ? this.displayLogItemBox(item): this.displayItemBox(item)
            
            }
          </div> : null}
      </div>
    )
  }
}
