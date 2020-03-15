import React, { Component } from 'react';
import './style.css';

import { Changer } from './Changer'
import { Timer } from './Timer'

export default class Pomodoro extends Component {
    constructor(props) {
      super(props);
      this.state = {
        runTime: 25,
        breakTime: 5,
      }
      this.updateTimes = this.updateTimes.bind(this)
      this.reset = this.reset.bind(this)
    }
  
    updateTimes(val) {
      this.setState({ runTime: val.runTime, breakTime: val.breakTime })
    }
  
    reset() {
      this.setState({ runTime: 25, breakTime: 5 })
    }
    render() {
  
      return (
        <div className="App">
          <h1>Pomodoro Clock</h1>
          <Changer set={this.updateTimes} breakTime={this.state.breakTime} runTime={this.state.runTime} />
          <Timer set={this.reset} run={this.state.runTime} break={this.state.breakTime} />
        </div>
      );
    }
  };