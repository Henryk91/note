import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPauseCircle, faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import './style.css';

type TimerProps = {
  run: number;
  breakTime: number;
  set: (val: unknown) => void;
};

const formatTime = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const m = mins < 10 ? `0${mins}` : `${mins}`;
  const s = secs < 10 ? `0${secs}` : `${secs}`;
  return `${m}:${s}`;
};

const Timer: React.FC<TimerProps> = ({ run, breakTime, set }) => {
  const [secondsLeft, setSecondsLeft] = useState(run * 60);
  const [remainingTime, setRemainingTime] = useState(formatTime(run * 60));
  const [session, setSession] = useState<'Session' | 'Break Time'>('Session');
  const [running, setRunning] = useState(false);

  const sessionRef = useRef<'Session' | 'Break Time'>('Session');
  const runRef = useRef(run);
  const breakRef = useRef(breakTime);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    runRef.current = run;
    breakRef.current = breakTime;
    setSecondsLeft(run * 60);
    setRemainingTime(formatTime(run * 60));
    setSession('Session');
    sessionRef.current = 'Session';
    setRunning(false);
  }, [run, breakTime]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextSession = sessionRef.current === 'Session' ? 'Break Time' : 'Session';
          sessionRef.current = nextSession;
          setSession(nextSession);

          const nextSeconds = (nextSession === 'Session' ? runRef.current : breakRef.current) * 60;
          setRemainingTime(formatTime(nextSeconds));
          audioRef.current?.play();
          return nextSeconds;
        }
        const next = prev - 1;
        setRemainingTime(formatTime(next));
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const starter = () => {
    setRunning((prev) => !prev);
  };

  const restart = () => {
    setRunning(false);
    setSession('Session');
    sessionRef.current = 'Session';
    setSecondsLeft(25 * 60);
    setRemainingTime('25:00');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    set('');
  };

  return (
    <div>
      <div id="timerBox">
        <h2 id="timer-label">{session}</h2>
        <h2 id="time-left">{remainingTime}</h2>
      </div>
      <div className="timePlay" id="start_stop" onClick={starter}>
        <FontAwesomeIcon icon={faPlayCircle} />
        <FontAwesomeIcon icon={faPauseCircle} />
      </div>
      <div className="timePlay" id="reset" onClick={restart}>
        <FontAwesomeIcon icon={faSync} className="sync-icon" />
      </div>
      <audio
        id="beep"
        preload="auto"
        src="https://www.myinstants.com/media/sounds/erro.mp3"
        ref={audioRef}
      >
        {' '}
      </audio>
    </div>
  );
};

export default Timer;
