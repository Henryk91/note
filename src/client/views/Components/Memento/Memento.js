import React, { Component } from 'react';
import './style.css';

export default class Memento extends Component {

    constructor(props) {
        super(props);
        this.year = this.year.bind(this)
    }

    year(props) {
        let year = []
        for(let i = 0; i < 52; i++){
    
            const week = (props.count * 52 + i + 1)
            let filled = (week <= props.weeks)? true: false;
            const date = (week * (1000 * 60 * 60 * 24 * 7)) + props.birthDayMilli
    
            year.push(<Week name="Sara" filled={filled} key={week} week={week} dateMilli={date} />)
        }
        let count = (((props.count + 1) % 5) === 0 ) ? (props.count + 1) : null;
        return (
            <div className="year">
                {year}
                {count? <span className="year-count">{ count }</span>: null}
            </div>
        );
    }
    
    weeksBetween(d1, d2) {
        return Math.round((d1 - d2) / (7 * 24 * 60 * 60 * 1000));
    }
        
    render() {
        const year=1991
        const month=10
        const day=6
        let years = []
        for(let i = 0; i < 80; i++){
            years.push(<Year count={(i )} key={i} year={year} month={month} day={day} /> )
        }
        const themeBorderColor = `${this.props.Theme.toLowerCase()}-border-color`;
        return (
            <div id="memento-wrapper">
                <div id="memento-main" className={themeBorderColor}>
                    <p id="title">MEMENTO MORI</p>
                    <div id="life-box">
                        <div className="frame" >
                            {years}
                        </div>
                    </div>
                    <br /> 
                    <span id="quote">
                        It's not that we have a short time to live, but that we waste much of it. 
                        Life is long enough, and it has been given in <br id="quote-break" /> sufficiently generous measure to allow 
                        the accomplishment of the very greatest things if the whole of it is well invested.
                    </span>
                    <span id="author">SENECA</span>
                </div>
            </div>
        );
    }
}
function Year(props) {
    let year = []
    for(let i = 0; i < 52; i++){

        const week = (props.count * 52 + i + 1);
        let startOfYear = new Date(props.year+props.count, props.month, props.day).getTime()
        const date = (i * (1000 * 60 * 60 * 24 * 7)) + startOfYear;

        year.push(<Week name="Sara" key={week} week={week} dateMilli={date} woy={i} />)
    }
    let count = (((props.count + 1) % 5) === 0 ) ? (props.count + 1) : null;
    return (
        <div className="year">
            {year}
            {count? <span className="year-count">{ count }</span>: null}
        </div>
    );
}

function Week(props) {

    const nowMili = new Date().getTime()
    const className = props.dateMilli <= nowMili ? 'week-box filled tooltip': 'week-box tooltip';
    const tooltiptextClass = props.woy > 25 ? 'right tooltiptext': 'left tooltiptext';
    const start = new Date(props.dateMilli).toDateString()
    const end = new Date(props.dateMilli + (1000 * 60 * 60 * 24 * 7)).toDateString()
    return (
        <span className={className}>
            <span className={tooltiptextClass}>
                Week: {props.week} <br />
                {start} - {end}
            </span>
        </span>
    );
}