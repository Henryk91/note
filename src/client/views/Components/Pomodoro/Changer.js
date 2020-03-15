
import React, { Component } from 'react';
import './style.css';

export class Changer extends Component {
    constructor(props) {
      super(props);
      this.state = {
        runTime: 25,
        breakTime: 5,
      }
      this.addBreak = this.addBreak.bind(this)
      this.subBreak = this.subBreak.bind(this)
      this.addSession = this.addSession.bind(this)
      this.subSession = this.subSession.bind(this)
    }
  
    componentDidUpdate(prevProps) {
  
      if (this.props.runTime !== prevProps.runTime || this.props.breakTime !== prevProps.breakTime) {
        this.setState({
          runTime: this.props.runTime,
          breakTime: this.props.breakTime,
        })
      }
    }
  
    addBreak() {
      let breakT = this.state.breakTime
      breakT++
      if (breakT <= 60) {
        this.setState({ breakTime: breakT })
        this.props.set({ runTime: this.state.runTime, breakTime: breakT })
      }
    }
    subBreak() {
      let breakT = this.state.breakTime
      breakT--
      if (breakT > 0) {
        this.setState({ breakTime: breakT })
        this.props.set({ runTime: this.state.runTime, breakTime: breakT })
      }
  
    }
    addSession() {
      let runT = this.state.runTime
      runT++
      if (runT <= 60) {
        this.setState({ runTime: runT })
        this.props.set({ runTime: runT, breakTime: this.state.breakTime })
      }
  
    }
    subSession() {
      let runT = this.state.runTime
      runT--
      if (runT > 0) {
        this.setState({ runTime: runT })
        this.props.set({ runTime: runT, breakTime: this.state.breakTime })
      }
    }
    render() {
  
      return (
        <div >
          <div className="timeChangers">
            <label id="break-label">Break Length</label><br />
            <span id="break-decrement" className="fas fa-arrow-down" onClick={this.subBreak}></span>
            <label id="break-length">{this.state.breakTime}</label>
            <span id="break-increment" className="fas fa-arrow-up" onClick={this.addBreak}></span>
          </div>
          <div className="timeChangers">
            <label id="session-label">Session Length</label><br />
            <span id="session-decrement" className="fas fa-arrow-down" onClick={this.subSession}></span>
            <label id="session-length">{this.state.runTime}</label> 
            <span id="session-increment" className="fas fa-arrow-up" onClick={this.addSession}></span>
          </div>
        </div>
      );
    }
  };
  
  