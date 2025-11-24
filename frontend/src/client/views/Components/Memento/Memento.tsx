import React from 'react';
import './style.css';

type YearProps = {
  day: number;
  month: number;
  year: number;
  count: number;
};

type WeekProps = {
  week: number;
  dateMilli: number;
  woy?: number;
};

const Week = ({ week, dateMilli, woy }: WeekProps) => {
  const nowMili = new Date().getTime();
  const className = dateMilli <= nowMili ? 'week-box filled tooltip' : 'week-box tooltip';
  const tooltiptextClass = woy && woy > 25 ? 'right tooltiptext' : 'left tooltiptext';
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
};

const Year = ({ day, month, year, count }: YearProps) => {
  const yearList: JSX.Element[] = [];
  for (let i = 0; i < 52; i += 1) {
    const week = count * 52 + i + 1;
    const startOfYear = new Date(year + count, month, day).getTime();
    const date = i * (1000 * 60 * 60 * 24 * 7) + startOfYear;

    yearList.push(<Week key={week} week={week} dateMilli={date} woy={i} />);
  }
  const newCount = (count + 1) % 5 === 0 ? count + 1 : null;
  return (
    <div className="year">
      {yearList}
      {newCount ? <span className="year-count">{newCount}</span> : null}
    </div>
  );
};

const Memento: React.FC<{ Theme: string }> = ({ Theme }) => {
  const year = 1991;
  const month = 10;
  const day = 6;
  const years: JSX.Element[] = [];
  for (let i = 0; i < 80; i += 1) {
    years.push(<Year count={i} key={i} year={year} month={month} day={day} />);
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
          It&apos;s not that we have a short time to live, but that we waste much of it. Life is long enough, and it
          has been given in <br id="quote-break" /> sufficiently generous measure to allow the accomplishment of the
          very greatest things if the whole of it is well invested.
        </span>
        <span id="author">SENECA</span>
      </div>
    </div>
  );
};

export default Memento;
