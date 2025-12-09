import React, { useState } from 'react';
import './style.css';

import Changer from './Changer';
import Timer from './Timer';

const Pomodoro: React.FC = () => {
  const [runTime, setRunTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);

  const updateTimes = (val: { runTime: number; breakTime: number }) => {
    setRunTime(val.runTime);
    setBreakTime(val.breakTime);
  };

  const reset = () => {
    setRunTime(25);
    setBreakTime(5);
  };

  return (
    <div className="App">
      <h1>Pomodoro Clock</h1>
      <Changer set={updateTimes} breakTime={breakTime} runTime={runTime} />
      <Timer set={reset} run={runTime} breakTime={breakTime} />
    </div>
  );
};

export default Pomodoro;
