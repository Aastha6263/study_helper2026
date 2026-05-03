import { useEffect, useState } from "react";

const DistractionTrackerPage = () => {
  const [focusTime, setFocusTime] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const [idleTime, setIdleTime] = useState(0);
  const [isActive, setIsActive] = useState(true);

  /* ⏱ TIMER */
  useEffect(() => {
    let timer;

    if (isActive) {
      timer = setInterval(() => {
        setFocusTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive]);

  /* 🔄 TAB SWITCH DETECTION */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setDistractions((prev) => prev + 1);
        setIsActive(false);
      } else {
        setIsActive(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  /* 💤 IDLE DETECTION */
  useEffect(() => {
    let idleTimer;

    const resetTimer = () => {
      setIdleTime(0);
      setIsActive(true);
    };

    const startIdleTimer = () => {
      idleTimer = setInterval(() => {
        setIdleTime((prev) => {
          if (prev >= 10) {
            setDistractions((d) => d + 1);
            setIsActive(false);
          }
          return prev + 1;
        });
      }, 1000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    startIdleTimer();

    return () => {
      clearInterval(idleTimer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);

  /* ⏱ FORMAT TIME */
  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* 🎯 SCORE */
  const score = Math.max(
    0,
    100 - distractions * 5 - Math.floor(idleTime / 2)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">

      <h1 className="text-3xl font-bold text-center mb-6">
        🧠 Distraction Tracker
      </h1>

      {/* Focus Time */}
      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow text-center mb-4">
        <h2 className="text-lg">Focus Time</h2>
        <p className="text-4xl font-bold text-blue-600">
          {formatTime(focusTime)}
        </p>
      </div>

      {/* Distractions */}
      <div className="max-w-md mx-auto bg-white p-4 rounded-xl shadow mb-4">
        <p>⚠️ Distractions: {distractions}</p>
        <p>💤 Idle Time: {idleTime}s</p>
      </div>

      {/* Score */}
      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow text-center">
        <h2 className="text-lg">Focus Score</h2>
        <p className="text-5xl font-bold text-green-600">
          {score}%
        </p>

        <div className="w-full bg-gray-200 h-3 rounded mt-3">
          <div
            className="bg-green-500 h-3 rounded"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

    </div>
  );
};

export default DistractionTrackerPage;