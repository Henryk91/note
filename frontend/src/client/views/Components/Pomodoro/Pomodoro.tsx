import React, { Component } from 'react';
import './style.css';

import Changer from './Changer';
import Timer from './Timer';

type PomodoroState = {
  runTime: number;
  breakTime: number;
};

export default class Pomodoro extends Component<unknown, PomodoroState> {
  constructor(props: unknown) {
    super(props);
    this.state = {
      runTime: 25,
      breakTime: 5,
    };
    this.updateTimes = this.updateTimes.bind(this);
    this.reset = this.reset.bind(this);
  }

  updateTimes(val) {
    this.setState({ runTime: val.runTime, breakTime: val.breakTime });
  }

  reset() {
    this.setState({ runTime: 25, breakTime: 5 });
  }

  render() {
    const { breakTime, runTime } = this.state;
    return (
      <div className="App">
        <h1>Pomodoro Clock</h1>
        <Changer
          set={this.updateTimes}
          breakTime={breakTime}
          runTime={runTime}
        />
        <Timer set={this.reset} run={runTime} breakTime={breakTime} />
      </div>
    );
  }
}
