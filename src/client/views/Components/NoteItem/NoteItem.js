/* eslint-disable react/no-danger */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable max-len */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/prop-types */
/* eslint-disable react/button-has-type */
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
      editingItem: false
    };
    this.deleteItem = this.deleteItem.bind(this);
    this.getMarkdownText = this.getMarkdownText.bind(this);
    this.editItemSet = this.editItemSet.bind(this);
  }

  // eslint-disable-next-line class-methods-use-this
  getMarkdownText(input) {
    const rawMarkup = marked(input, { sanitize: false });
    return { __html: rawMarkup };
  }

  submitChange = e => {
    e.preventDefault();
    let update = e.target.item.value;
    if (e.target.itemDate) {
      update = {
        json: true,
        date: e.target.itemDate.value,
        data: e.target.item.value
      };
      update = JSON.stringify(update);
    }
    const { item } = this.state;
    const { index, type } = this.props;
    this.props.set({
      item: update,
      oldItem: item,
      index,
      type,
      delete: false
    });
    this.setState({ editingItem: false, item: update });
  };

  editItem = () => {
    this.setState({ editingItem: true });
  };

  deleteItem = e => {
    e.preventDefault();
    if (confirm('Are you sure you want to permanently delete this?')) {
      this.setState({ item: null });
      this.props.set({
        oldItem: this.state.item,
        index: this.props.index,
        type: this.props.type,
        delete: true
      });
    }
  };

  editItemSet = bVal => {
    this.setState({ editingItem: bVal });
  };


  removeHideClass = () => {
    var nodes = document.querySelectorAll(".hidden-noteItemBox")
    for (var i =0; i < nodes.length; i++) {
        nodes[i].classList.remove("hidden-noteItemBox")
    }
  }

  closeEdit = () => {
    this.setState({ editingItem: false })
    this.removeHideClass()
  }

  editItemBox(item) {
    const { Theme } = this.props;
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeHover = `${Theme.toLowerCase()}-hover`;
    let editText = item;
    const isLog = item.includes('"json":true');
    let editDate = null;
    let editInputDate = null;
    if (isLog) {
      const logObj = JSON.parse(item);
      console.log(logObj.date);
      editDate = logObj.date;
      editText = logObj.data;
      console.log(logObj.data);
      editInputDate = this.dateToInputDisplayDate(new Date(editDate))
    }
    return (
      <form onSubmit={this.submitChange} className="noteItemEditBox">
        {isLog ? (
          <>
            <input onChange={this.changeDate} defaultValue={editInputDate} className={themeBack} type="datetime-local" name="dateSelector" />
            <textarea id="text-date" className={`editDateArea ${themeBack}`} name="itemDate" type="text" defaultValue={editDate} />
          </>
        ) : null}
        <textarea className={`editTextarea ${themeBack}`} name="item" type="text" defaultValue={editText} />
        <br />
        <button className={`submit-button ${themeBack} ${themeHover}`} type="submit">
          {' '}
          <i className="fas fa-check" />
        </button>
        <button className={`submit-button ${themeBack} ${themeHover}`} onClick={() => this.closeEdit()}>
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

  changeDate = e => {
    e.preventDefault();
    const selectedDate = e.target.value;
    let date = new Date(selectedDate);
    this.setState({ displayDate: date, inputDisplayDate: this.dateToInputDisplayDate(date) });
    document.getElementById('text-date').value = date;
  };

  dateToInputDisplayDate = (date) => {
    if (!date || isNaN(date)) return ''
    let minutes = this.addLeadingZero(date.getMinutes())
    let hours = this.addLeadingZero(date.getHours())
    return date.toISOString().split('T')[0] + "T" + hours + ":" + minutes
  }

  addLeadingZero = (number) => {
    if(number < 10) number = "0" + number
    return number
  }

  hideLogLines = () => {
    var nodes = document.querySelectorAll(".noteItemBox")
    for (var i =0; i < nodes.length; i++) {
        nodes[i].classList.add("hidden-noteItemBox")
    }
  }

  setEditState = () => {
    this.setState({ editingItem: true })
    this.hideLogLines()
    window.scrollTo({top: 0});
  }

  displayItemBox(item) {
    const { Theme, showEdit, count, show } = this.props;
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeBackHover = `${Theme.toLowerCase()}-hover`;
    const themeBorder = `${Theme.toLowerCase()}-border-thick`;

    const noteItemClass = count > 0 ? 'noteItemHasCount' : 'noteItem';

    return (
      <div className="noteItemBox" onClick={() => this.setEditState()}>
        {show ? (
          <div className="logLine">
            {showEdit ? null : <div className={`listCountBox noteItemCount ${themeBorder}`}> <span className="list-count-item">{count}</span> </div>}
            <div className={`${noteItemClass} white-color`} dangerouslySetInnerHTML={this.getMarkdownText(item)} />
            {/* {showEdit ? (
              <div className={`editButtons ${themeBack} ${themeBackHover}`} >
                <i className="fas fa-pen" />
              </div>
            ) : null} */}
            
          </div>
        ) : (
          ''
        )}
       {show ? ( <hr />) : null}
      </div>
    );
  }

  displayLogItemBox(item) {
    const { show, date, Theme, prevItem, nextItem } = this.props;
    const parsedItem = JSON.parse(item);

    let showItem = show;
    const newDate = parsedItem.date.substring(0, parsedItem.date.indexOf('GMT')).trim();
    let selectedDate = date;
    if (selectedDate) {
      selectedDate = `${new Date(selectedDate)}`;
      selectedDate = selectedDate.substring(0, 16);
      if (showItem && !newDate.includes(selectedDate)) {
        showItem = false;
      }
    }
    if(!showItem) return
    const themeBack = `${Theme.toLowerCase()}-back`;
    const themeBackHover = `${Theme.toLowerCase()}-hover`;
    const hasBreak =
      parsedItem.data === 'Break'
        ? 'logNoteItem'
        : parsedItem.data === 'Pause'
        ? 'logNoteItem'
        : parsedItem.data === 'Lunch'
        ? 'logNoteItem'
        : null;
    let prevData = null;

    if (prevItem !== null && prevItem !== undefined) {
      prevData = JSON.parse(prevItem).data;
    }
    let duration = showItem? getLogDuration(nextItem, parsedItem, checkIsToday(newDate)): '';

    if(!showItem)  duration = '';

    return (
      <div className="noteItemBox">
        {showItem ? (
          <div>
            <div>
              <p className="noteItem white-color log-noteItem" onClick={() => this.setState({ editingItem: true })}>{newDate} {duration}</p>
              <div className={`noteItem ${hasBreak} dangerous-text`} dangerouslySetInnerHTML={this.getMarkdownText(parsedItem.data)} />
              {/* <button className={`editButtons ${themeBack} ${themeBackHover}`} onClick={() => this.setState({ editingItem: true })}>
                <i className="fas fa-pen" />
              </button> */}
              {hasBreak && prevData ? (
                <button className={`editButtons ${themeBack} ${themeBackHover}`} onClick={() => this.props.cont({ cont: prevData })}>
                  Cont
                </button>
              ) : null}
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
    const { item } = this.state;
    const { itemPrev, editingItem } = this.state;
    const { show } = this.props;
    let editing = editingItem;
    let isLog = false;

    if (item) isLog = item.includes('"json":true');

    if (editing) {
      if (!show) this.editItemSet(false);
      editing = show;
    }
    return (
      <div>
        {item ? (
          <div className="noteTagBox">
            {editing ? this.editItemBox(item) : isLog ? this.displayLogItemBox(item, itemPrev) : this.displayItemBox(item)}
          </div>
        ) : null}
      </div>
    );
  }
}

const checkIsToday = (someDate) => {
  const today = new Date();
  someDate = new Date(someDate);
  return someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear();
};

function getLogDuration(nextItem, parsedItem, isToday) {
  const parsedNextItem = nextItem ? JSON.parse(nextItem) : null;

  const getTimeDifference = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = (endDate.getTime() - startDate.getTime());
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;

    return hours + ":" + minutes;
  };

  let nextDate = parsedNextItem ? parsedNextItem.date : null;

  if (!nextDate) {
    
    if (checkIsToday(parsedItem.date)) {
      nextDate = new Date() + "";
    }
  }

  const duration = nextDate ? "(" + getTimeDifference(parsedItem.date, nextDate) + ")" : '';
  return duration;
}

