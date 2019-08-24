import React, { Component } from 'react';
import marked from 'marked';

marked.setOptions({
  breaks: true
});

export default class NoteItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      item: this.props.item,
      prevItem: this.props.prevItem,
      editingItem: false
    };
    this.deleteItem = this.deleteItem.bind(this);
    this.getMarkdownText = this.getMarkdownText.bind(this);
    this.editItemSet = this.editItemSet.bind(this);
  }

  deleteItem = e => {
    e.preventDefault();
    if (confirm('Are you sure you want to permanently delete this?')) {
      this.setState({ item: null });
      this.props.set({ oldItem: this.state.item, index: this.props.index, type: this.props.type, delete: true });
    }
  };

  editItem = () => {
    this.setState({ editingItem: true });
  };

  submitChange = e => {
    e.preventDefault();
    let update = e.target.item.value;
    this.props.set({ item: update, oldItem: this.state.item, index: this.props.index, type: this.props.type, delete: false });
    this.setState({ editingItem: false, item: update });
  };

  getMarkdownText(input) {
    let rawMarkup = marked(input, { sanitize: true });
    return { __html: rawMarkup };
  }

  editItemBox(item) {
    let themeBack = this.props.Theme.toLowerCase() + '-back';
    let themeHover = this.props.Theme.toLowerCase() + '-hover';
    return (
      <form onSubmit={this.submitChange} className="noteItemBox" className="noteItemEditBox">
        <textarea className={`editTextarea ${themeBack}`} name="item" type="text" defaultValue={item} />
        <br />
        <button className={`submit-button ${themeBack} ${themeHover}`} type="submit">
          {' '}
          <i className="fas fa-check" />
        </button>
        <button className={`submit-button ${themeBack} ${themeHover}`} onClick={() => this.setState({ editingItem: false })}>
          <i className="fas fa-times" />
        </button>
        <button className={`submit-button ${themeBack} ${themeHover}`} onClick={this.deleteItem}>
          {' '}
          <i className="far fa-trash-alt" />{' '}
        </button>
        <hr />
        <br />
      </form>
    );
  }

  getMarkdownText(item) {
    let rawMarkup = marked(item, { sanitize: true });
    return { __html: rawMarkup };
  }

  displayItemBox(item) {
    let themeBack = this.props.Theme.toLowerCase() + '-back';
    let themeBackHover = this.props.Theme.toLowerCase() + '-hover';
    return (
      <div className="noteItemBox">
        {this.props.show ? (
          <div>
            <div className="noteItem white-color" dangerouslySetInnerHTML={this.getMarkdownText(item)} />
            <div className={`editButtons ${themeBack} ${themeBackHover}`} onClick={() => this.setState({ editingItem: true })}>
              <i className="fas fa-pen" />
            </div>
            <hr />
          </div>
        ) : (
          ''
        )}
      </div>
    );
  }
  editItemSet = bVal => {
    this.setState({ editingItem: bVal });
  };
  displayLogItemBox(item) {
    item = JSON.parse(item);

    let showItem = this.props.show;
    let date = item.date.substring(0, item.date.indexOf('GMT')).trim();
    let selectedDate = this.props.date;
    if (selectedDate) {
      selectedDate = new Date(selectedDate) + '';
      selectedDate = selectedDate.substring(0, 16);
      if (showItem && !date.includes(selectedDate)) {
        showItem = false;
      }
    }
    let themeBack = this.props.Theme.toLowerCase() + '-back';
    let themeBackHover = this.props.Theme.toLowerCase() + '-hover';
    const hasBreak = item.data === 'Break' ? "logNoteItem" : item.data === 'Pause' ? "logNoteItem" : item.data === 'Lunch' ? "logNoteItem" : null;
    let prevData = null;
    
    if (this.props.prevItem !== null && this.props.prevItem !== undefined) {
      prevData = JSON.parse(this.props.prevItem).data;
    }
    
    return (
      <div className="noteItemBox">
        {showItem ? (
          <div>
            <div>
              <p className="noteItem white-color"> {date} </p>
              <p className={`noteItem ${hasBreak}`}> {item.data} </p>
              <button className={`editButtons ${themeBack} ${themeBackHover}`} onClick={() => this.setState({ editingItem: true })}>
                <i className="fas fa-pen" />
              </button>
              { 
                hasBreak && prevData ? 
                <button className={`editButtons ${themeBack} ${themeBackHover}`} onClick={() => this.props.cont({ cont: prevData })}>
                Cont
              </button> 
              : null  }
            </div>
            <hr />
          </div>
        ) : (
          ''
        )}
      </div>
    );
  }

  render() {
    const item = this.state.item;
    const prevData = this.state.itemPrev;
    let editing = this.state.editingItem;
    let isLog = false;

    if (item) isLog = item.includes('json');
    if (editing) {
      if (!this.props.show) this.editItemSet(false);
      editing = this.props.show;
    }
    return (
      <div>
        {item ? (
          <div className="noteTagBox">
            {editing ? this.editItemBox(item) : isLog ? this.displayLogItemBox(item, prevData) : this.displayItemBox(item)}
          </div>
        ) : null}
      </div>
    );
  }
}
