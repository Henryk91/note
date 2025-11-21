import React, { Component } from 'react';
import './style.css';

export default class Changer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      runTime: 25,
      breakTime: 5,
    };
    this.addBreak = this.addBreak.bind(this);
    this.subBreak = this.subBreak.bind(this);
    this.addSession = this.addSession.bind(this);
    this.subSession = this.subSession.bind(this);
  }

  componentDidUpdate(prevProps) {
    const { runTime, breakTime } = this.props;
    if (runTime !== prevProps.runTime || breakTime !== prevProps.breakTime) {
      this.setState({
        runTime,
        breakTime,
      });
    }
  }

  addBreak() {
    const { set } = this.props;
    const { breakTime, runTime } = this.state;
    let breakT = breakTime;
    breakT++;
    if (breakT <= 60) {
      this.setState({ breakTime: breakT });
      set({ runTime, breakTime: breakT });
    }
  }

  subBreak() {
    const { set } = this.props;
    const { breakTime, runTime } = this.state;
    let breakT = breakTime;
    breakT--;
    if (breakT > 0) {
      this.setState({ breakTime: breakT });
      set({ runTime, breakTime: breakT });
    }
  }

  addSession() {
    const { set } = this.props;
    const { breakTime, runTime } = this.state;
    let runT = runTime;
    runT++;
    if (runT <= 60) {
      this.setState({ runTime: runT });
      set({ runTime: runT, breakTime });
    }
  }

  subSession() {
    const { set } = this.props;
    const { breakTime, runTime } = this.state;
    let runT = runTime;
    runT--;
    if (runT > 0) {
      this.setState({ runTime: runT });
      set({ runTime: runT, breakTime });
    }
  }

  render() {
    const { breakTime, runTime } = this.state;
    return (
      <div>
        <div className="timeChangers">
          <label id="break-label">Break Length</label>
          <br />
          <span
            id="break-decrement"
            className="fas fa-arrow-down"
            onClick={this.subBreak}
          />
          <label id="break-length">{breakTime}</label>
          <span
            id="break-increment"
            className="fas fa-arrow-up"
            onClick={this.addBreak}
          />
        </div>
        <div className="timeChangers">
          <label id="session-label">Session Length</label>
          <br />
          <span
            id="session-decrement"
            className="fas fa-arrow-down"
            onClick={this.subSession}
          />
          <label id="session-length">{runTime}</label>
          <span
            id="session-increment"
            className="fas fa-arrow-up"
            onClick={this.addSession}
          />
        </div>
      </div>
    );
  }
}
