import React, { useEffect, useState } from "react";

const Clock: React.FC = () => {
  const [time, setTime] = useState<string>(new Date().toLocaleString());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000); // update every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="clock-container">
        <span className="clock-icon">🕒</span>
        <span className="clock-time">{time}</span>
  </div>
  );
};

export default Clock;
