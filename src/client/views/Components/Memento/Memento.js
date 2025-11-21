import React, { Component } from 'react';
import './style.css';

export default class Memento extends Component {
  constructor(props) {
    super(props);
    this.year = this.year.bind(this);
  }

  year(props) {
    const year = [];
    for (let i = 0; i < 52; i++) {
      const week = props.count * 52 + i + 1;
      const filled = week <= props.weeks;
      const date = week * (1000 * 60 * 60 * 24 * 7) + props.birthDayMilli;

      year.push(
        <Week
          name="Sara"
          filled={filled}
          key={week}
          week={week}
          dateMilli={date}
        />,
      );
    }
    const count = (props.count + 1) % 5 === 0 ? props.count + 1 : null;
    return (
      <div className="year">
        {year}
        {count ? <span className="year-count">{count}</span> : null}
      </div>
    );
  }

  render() {
    const { Theme } = this.props;
    const year = 1991;
    const month = 10;
    const day = 6;
    const years = [];
    for (let i = 0; i < 80; i++) {
      years.push(
        <Year count={i} key={i} year={year} month={month} day={day} />,
      );
    }
    const themeBorderColor = `${Theme.toLowerCase()}-border-color`;
    return (
      <div id="memento-wrapper">
        <div id="memento-main" className={themeBorderColor}>
          <p id="title">MEMENTO MORI</p>
          <div id="life-box">
            <div className="frame">{years}</div>
          </div>
          <br />
          <span id="quote">
            It&apos;s not that we have a short time to live, but that we waste
            much of it. Life is long enough, and it has been given in{' '}
            <br id="quote-break" /> sufficiently generous measure to allow the
            accomplishment of the very greatest things if the whole of it is
            well invested.
          </span>
          <span id="author">SENECA</span>
        </div>
      </div>
    );
  }
}
function Year(props) {
  const { day, month, year, count } = props;
  const yearList = [];
  for (let i = 0; i < 52; i++) {
    const week = count * 52 + i + 1;
    const startOfYear = new Date(year + count, month, day).getTime();
    const date = i * (1000 * 60 * 60 * 24 * 7) + startOfYear;

    yearList.push(
      <Week name="Sara" key={week} week={week} dateMilli={date} woy={i} />,
    );
  }
  const newCount = (count + 1) % 5 === 0 ? count + 1 : null;
  return (
    <div className="year">
      {yearList}
      {newCount ? <span className="year-count">{newCount}</span> : null}
    </div>
  );
}

function Week(props) {
  const nowMili = new Date().getTime();
  const { week, dateMilli, woy } = props;
  const className =
    dateMilli <= nowMili ? 'week-box filled tooltip' : 'week-box tooltip';
  const tooltiptextClass = woy > 25 ? 'right tooltiptext' : 'left tooltiptext';
  const start = new Date(dateMilli).toDateString();
  const end = new Date(dateMilli + 1000 * 60 * 60 * 24 * 7).toDateString();
  return (
    <span className={className}>
      <span className={tooltiptextClass}>
        Week: {week} <br />
        {start} - {end}
      </span>
    </span>
  );
}
