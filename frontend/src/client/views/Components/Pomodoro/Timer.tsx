import React, { Component } from 'react';
import './style.css';

type TimerProps = {
  run: number;
  breakTime: number;
  set: (val: unknown) => void;
};

type TimerState = {
  time: number;
  started: boolean;
  session: string;
  runTime: number;
  breakTime: number;
  secondsLeft: number;
  run: boolean;
  remainingTime: string;
  intervalCounter: any;
};

export default class Timer extends Component<TimerProps, TimerState> {
  audio: HTMLAudioElement | null = null;

  constructor(props: TimerProps) {
    super(props);
    const { run, breakTime } = this.props;
    this.state = {
      time: 0,
      started: false,
      session: 'Session',
      runTime: run,
      breakTime,
      secondsLeft: run * 60,
      run: false,
      remainingTime: `${run}:00`,
      intervalCounter: '',
    };

    this.restart = this.restart.bind(this);
    this.starter = this.starter.bind(this);
    this.timeConvert = this.timeConvert.bind(this);
  }

  componentDidUpdate(prevProps) {
    const { run, breakTime } = this.props;
    if (run !== prevProps.run || breakTime !== prevProps.breakTime) {
      this.setState({
        runTime: run,
        breakTime,
        secondsLeft: run * 60,
        run: false,
        remainingTime: `${run}:00`,
      });
    }
  }

  starter() {
    const { started, intervalCounter, run } = this.state;
    if (!started) {
      this.setState({ started: true });
    } else {
      this.setState({ started: false });
      this.setState({
        intervalCounter: clearInterval(intervalCounter),
        run: false,
      });
    }

    if (!run) {
      this.setState({
        run: true,
        intervalCounter: setInterval(() => {
          this.tock();
        }, 1000),
      });
    }
  }

  timeConvert() {
    const { secondsLeft } = this.state;
    let time = secondsLeft;
    time--;
    let digTime;
    if (time > 0) {
      const remaining = time;
      const remMin = Math.floor(remaining / 60);
      const remSec = remaining - remMin * 60;
      let remMinString = `${remMin}`;
      let remSecString = `${remSec}`;

      if (remSec < 10) remSecString = `0${remSec}`;
      if (remMin < 10) remMinString = `0${remMin}`;
      digTime = `${remMinString}:${remSecString}`;
    } else {
      digTime = '00:00';
      time = 0;
    }

    return [digTime, time];
  }

  tock() {
    const time = this.timeConvert();
    const { remainingTime, runTime, breakTime } = this.state;

    if (remainingTime === '00:00') {
      this.audio?.play();
      const { session } = this.state;

      let timerVal;
      let sessionlabel;

      if (session === 'Break Time') {
        timerVal = runTime;
        sessionlabel = 'Session';
      }

      if (session === 'Session') {
        timerVal = breakTime;
        sessionlabel = 'Break Time';
      }

      let digTime;
      if (timerVal < 10) {
        digTime = `0${timerVal}:00`;
      } else {
        digTime = `${timerVal}:00`;
      }
      this.setState({
        secondsLeft: timerVal * 60,
        remainingTime: digTime,
        session: sessionlabel,
      });
    } else {
      this.setState({ secondsLeft: time[1], remainingTime: time[0] });
    }
  }

  restart() {
    const { intervalCounter } = this.state;
    const { set } = this.props;
    this.setState({
      time: 0,
      started: false,
      session: 'Session',
      runTime: 25,
      breakTime: 5,
      secondsLeft: 1500,
      run: false,
      remainingTime: '25:00',
      intervalCounter: clearInterval(intervalCounter),
    });

    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    set('');
  }

  render() {
    const { remainingTime, session } = this.state;
    return (
      <div>
        <div id="timerBox">
          <h2 id="timer-label">{session}</h2>
          <h2 id="time-left">{remainingTime}</h2>
        </div>
        <div className="timePlay" id="start_stop" onClick={this.starter}>
          <span className="far fa-play-circle" />
          <span className="far fa-pause-circle" />
        </div>
        <div className="timePlay" id="reset" onClick={this.restart}>
          <span className="fas fa-sync" />
        </div>
        <audio
          id="beep"
          preload="auto"
          src="https://www.myinstants.com/media/sounds/erro.mp3"
          ref={(audio) => {
            this.audio = audio;
          }}
        >
          {' '}
        </audio>
      </div>
    );
  }
}
