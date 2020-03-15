import React, { Component } from 'react';
import './style.css';
export class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
      started: false,
      session: 'Session',
      runTime: this.props.run,
      breakTime: this.props.break,
      secondsLeft: (this.props.run * 60),
      run: false,
      remainingTime: "" + this.props.run + ":00",
      intervalCounter: ''
    }

    this.restart = this.restart.bind(this)
    this.starter = this.starter.bind(this)
    this.audio = this.audio.bind(this)
    this.timeConvert = this.timeConvert.bind(this)
  }
  componentDidUpdate(prevProps) {

    if (this.props.run !== prevProps.run || this.props.break !== prevProps.break) {
      this.setState({
        runTime: this.props.run,
        breakTime: this.props.break,
        secondsLeft: (this.props.run * 60),
        run: false,
        remainingTime: this.props.run + ":00"
      })
    }
  }

  starter() {

    if (!this.state.started) {
      this.setState({ started: true })
    } else {
      this.setState({ started: false })
      this.setState({
        intervalCounter: clearInterval(this.state.intervalCounter),
        run: false,
      })
    }

    if (!this.state.run) {

      this.setState({
        run: true,
        intervalCounter: setInterval(() => {
          this.tock();
        }, 1000)
      })
    }

  }

  timeConvert() {
    let time = this.state.secondsLeft
    time--
    var digTime;
    if (time > 0) {
      let remaining = time
      let remMin = Math.floor(remaining / 60)
      let remSec = remaining - (remMin * 60)

      if (remSec < 10) remSec = "0" + remSec
      if (remMin < 10) remMin = "0" + remMin
      digTime = "" + remMin + ":" + remSec
    } else {
      digTime = "00:00"
      time = 0;
    }

    return [digTime, time]
  }
  tock() {
    let time = this.timeConvert()

    if (this.state.remainingTime === "00:00") {

      this.audio.play();
      let session = this.state.session;

      let timerVal;
      let sessionlabel;

      if (session === "Break Time") {
        timerVal = this.state.runTime
        sessionlabel = "Session"
      }


      if (session === "Session") {
        timerVal = this.state.breakTime
        sessionlabel = "Break Time"
      }

      var digTime;
      if (timerVal < 10) {
        digTime = "0" + timerVal + ":00"
      } else {
        digTime = timerVal + ":00"
      }
      this.setState({ secondsLeft: (timerVal * 60), remainingTime: digTime, session: sessionlabel });
    } else {
      this.setState({ secondsLeft: time[1], remainingTime: time[0] });
    }
  }

  restart() {
    this.setState({
      time: 0,
      started: false,
      session: 'Session',
      runTime: 25,
      breakTime: 5,
      secondsLeft: 1500,
      run: false,
      remainingTime: "25:00",
      intervalCounter: clearInterval(this.state.intervalCounter)
    })

    this.audio.pause();
    this.audio.currentTime = 0;

    this.props.set("")
  }

  audio() {

  }

  render() {


    return (
      <div >
        <div id="timerBox">
          <h2 id="timer-label">{this.state.session}</h2>
          <h2 id="time-left">{this.state.remainingTime}</h2>
        </div>
        <div className="timePlay" id="start_stop" onClick={this.starter}>
          <span className="far fa-play-circle" ></span>
          <span className="far fa-pause-circle" ></span>
        </div>
        <div className="timePlay" id="reset" onClick={this.restart}>
          <span className="fas fa-sync" ></span>
        </div>
        <audio id="beep" preload="auto" src="https://goo.gl/65cBl1" ref={(audio) => { this.audio = audio; }} > </audio>
      </div>
    );
  }
};
