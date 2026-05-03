
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square } from "lucide-react";
import toast from "react-hot-toast";

/* 🎨 CARD */
const Card = ({ children }) => (
  <div className="bg-black/40 backdrop-blur-xl p-6 rounded-2xl shadow text-white">
    {children}
  </div>
);

/* ⏱ FORMAT */
const format = (s) => {
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
};

export default function FocusModePage() {
  const [task, setTask] = useState("DSA Practice");
  const [time, setTime] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const intervalRef = useRef();

  /* 🖥 FULLSCREEN */
  const enterFullscreen = () => {
    document.documentElement.requestFullscreen();
  };

  const exitFullscreen = () => {
    document.exitFullscreen();
  };

  /* ▶️ START */
  const start = () => {
    enterFullscreen();
    setSessionActive(true);
    setIsRunning(true);
    toast.success("Focus Mode Started 🔥");
  };

  /* ⏸ PAUSE */
  const pause = () => {
    setIsRunning(false);
  };

  /* ▶️ RESUME */
  const resume = () => {
    setIsRunning(true);
  };

  /* ⛔ END */
  const end = () => {
    setIsRunning(false);
    setSessionActive(false);
    exitFullscreen();
    setTime(1500);
    toast.success("Session Completed ✅");
  };

  /* ⏱ TIMER */
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((t) => {
          if (t === 0) {
            toast("Take a break 😎");
            end();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  /* ⚠️ TAB SWITCH DETECTION */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && sessionActive) {
        toast.error("⚠️ Stay focused!");
        setIsRunning(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [sessionActive]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">

      {!sessionActive ? (
        <div className="space-y-6 max-w-md w-full">

          <h1 className="text-2xl font-bold text-center">🎯 Focus Mode</h1>

          {/* TASK SELECT */}
          <Card>
            <label className="text-sm">Select Task</label>
            <select
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="w-full mt-2 p-3 rounded-xl bg-black border border-gray-600"
            >
              <option>DSA Practice</option>
              <option>Math Chapter</option>
              <option>Revision</option>
            </select>
          </Card>

          {/* START */}
          <button
            onClick={start}
            className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 font-semibold"
          >
            🚀 Start Focus Mode
          </button>

        </div>
      ) : (
        <div className="text-center space-y-6">

          <h2 className="text-lg text-gray-400">{task}</h2>

          {/* TIMER */}
          <h1 className="text-7xl font-bold">{format(time)}</h1>

          {/* CONTROLS */}
          <div className="flex justify-center gap-4">

            {isRunning ? (
              <button onClick={pause} className="bg-yellow-500 px-4 py-2 rounded-xl flex gap-2">
                <Pause size={16} /> Pause
              </button>
            ) : (
              <button onClick={resume} className="bg-blue-500 px-4 py-2 rounded-xl flex gap-2">
                <Play size={16} /> Resume
              </button>
            )}

            <button onClick={end} className="bg-red-500 px-4 py-2 rounded-xl flex gap-2">
              <Square size={16} /> End
            </button>

          </div>

          {/* STATUS */}
          <p className="text-sm text-gray-400">
            {isRunning ? "🧠 Deep Focus..." : "Paused"}
          </p>

        </div>
      )}

    </div>
  );
}