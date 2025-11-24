import React, { useEffect, useState } from 'react';
import './style.css';

type ChangerProps = {
  runTime: number;
  breakTime: number;
  set: (val: { runTime: number; breakTime: number }) => void;
};

const Changer: React.FC<ChangerProps> = ({ runTime, breakTime, set }) => {
  const [state, setState] = useState({ runTime, breakTime });

  useEffect(() => {
    setState({ runTime, breakTime });
  }, [runTime, breakTime]);

  const addBreak = () => {
    setState((prev) => {
      const next = Math.min(prev.breakTime + 1, 60);
      const newState = { ...prev, breakTime: next };
      set({ runTime: prev.runTime, breakTime: next });
      return newState;
    });
  };

  const subBreak = () => {
    setState((prev) => {
      const next = Math.max(prev.breakTime - 1, 1);
      const newState = { ...prev, breakTime: next };
      set({ runTime: prev.runTime, breakTime: next });
      return newState;
    });
  };

  const addSession = () => {
    setState((prev) => {
      const next = Math.min(prev.runTime + 1, 60);
      const newState = { ...prev, runTime: next };
      set({ runTime: next, breakTime: prev.breakTime });
      return newState;
    });
  };

  const subSession = () => {
    setState((prev) => {
      const next = Math.max(prev.runTime - 1, 1);
      const newState = { ...prev, runTime: next };
      set({ runTime: next, breakTime: prev.breakTime });
      return newState;
    });
  };

  return (
    <div>
      <div className="timeChangers">
        <label id="break-label">Break Length</label>
        <br />
        <span id="break-decrement" className="fas fa-arrow-down" onClick={subBreak} />
        <label id="break-length">{state.breakTime}</label>
        <span id="break-increment" className="fas fa-arrow-up" onClick={addBreak} />
      </div>
      <div className="timeChangers">
        <label id="session-label">Session Length</label>
        <br />
        <span id="session-decrement" className="fas fa-arrow-down" onClick={subSession} />
        <label id="session-length">{state.runTime}</label>
        <span id="session-increment" className="fas fa-arrow-up" onClick={addSession} />
      </div>
    </div>
  );
};

export default Changer;
