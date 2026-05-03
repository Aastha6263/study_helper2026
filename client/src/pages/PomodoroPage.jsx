import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import toast from "react-hot-toast";

/* 🎨 CARD */
const Card = ({ children }) => (
  <div className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl shadow">
    {children}
  </div>
);

/* ⏱ FORMAT */
const format = (s) => {
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
};

export default function PomodoroPage() {

  /* ⚙️ SETTINGS */
  const [focusTime, setFocusTime] = useState(1500);
  const [shortBreak, setShortBreak] = useState(300);
  const [longBreak, setLongBreak] = useState(900);

  /* 🔄 STATE */
  const [mode, setMode] = useState("focus");
  const [time, setTime] = useState(focusTime);
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(0);

  const [sessions, setSessions] = useState([]);

  const intervalRef = useRef();

  /* 🔔 SOUND */
  const playSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play();
  };

  /* ▶️ START */
  const start = () => setIsRunning(true);

  /* ⏸ PAUSE */
  const pause = () => setIsRunning(false);

  /* 🔄 RESET */
  const reset = () => {
    setIsRunning(false);
    setTime(mode === "focus" ? focusTime : shortBreak);
  };

  /* ⏭ SKIP */
  const skip = () => {
    handleNext();
  };

  /* 🔄 AUTO FLOW */
  const handleNext = () => {
    playSound();

    if (mode === "focus") {
      setSessions((prev) => [...prev, { type: "focus", duration: focusTime }]);

      if ((cycle + 1) % 4 === 0) {
        setMode("long");
        setTime(longBreak);
        toast("Long Break 😎");
      } else {
        setMode("short");
        setTime(shortBreak);
        toast("Short Break ☕");
      }

      setCycle((c) => c + 1);
    } else {
      setMode("focus");
      setTime(focusTime);
      toast("Back to Focus 💪");
    }
  };

  /* ⏱ TIMER */
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((t) => {
          if (t === 0) {
            handleNext();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  /* 💾 LOCAL STORAGE */
  useEffect(() => {
    localStorage.setItem("pomodoroSessions", JSON.stringify(sessions));
  }, [sessions]);

  /* 📊 LOAD */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("pomodoroSessions"));
    if (data) setSessions(data);
  }, []);

  /* 🎨 MODE COLOR */
  const modeColor =
    mode === "focus"
      ? "text-blue-600"
      : mode === "short"
      ? "text-green-600"
      : "text-purple-600";

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-100 via-white to-indigo-100">

      <h1 className="text-2xl font-bold mb-6">🍅 Pomodoro System</h1>

      <div className="max-w-3xl mx-auto space-y-6">

        {/* MODE */}
        <Card>
          <p className={`text-center text-lg font-semibold ${modeColor}`}>
            {mode === "focus" && "📚 Focus Time"}
            {mode === "short" && "☕ Short Break"}
            {mode === "long" && "🧘 Long Break"}
          </p>

          <h2 className="text-6xl text-center font-bold my-4">
            {format(time)}
          </h2>

          {/* CONTROLS */}
          <div className="flex justify-center gap-4">

            {!isRunning ? (
              <button onClick={start} className="bg-green-500 text-white px-4 py-2 rounded-xl flex gap-2">
                <Play size={16} /> Start
              </button>
            ) : (
              <button onClick={pause} className="bg-yellow-500 text-white px-4 py-2 rounded-xl flex gap-2">
                <Pause size={16} /> Pause
              </button>
            )}

            <button onClick={reset} className="bg-gray-500 text-white px-4 py-2 rounded-xl flex gap-2">
              <RotateCcw size={16} /> Reset
            </button>

            <button onClick={skip} className="bg-blue-500 text-white px-4 py-2 rounded-xl flex gap-2">
              <SkipForward size={16} /> Skip
            </button>

          </div>

          {/* CYCLE */}
          <p className="text-center mt-3 text-sm text-gray-500">
            Cycle: {cycle % 4} / 4
          </p>
        </Card>

        {/* ⚙️ SETTINGS */}
        <Card>
          <h3 className="font-semibold mb-3">⚙️ Settings</h3>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <input
              type="number"
              value={focusTime / 60}
              onChange={(e) => setFocusTime(e.target.value * 60)}
              className="p-2 border rounded"
              placeholder="Focus"
            />
            <input
              type="number"
              value={shortBreak / 60}
              onChange={(e) => setShortBreak(e.target.value * 60)}
              className="p-2 border rounded"
              placeholder="Short"
            />
            <input
              type="number"
              value={longBreak / 60}
              onChange={(e) => setLongBreak(e.target.value * 60)}
              className="p-2 border rounded"
              placeholder="Long"
            />
          </div>
        </Card>

        {/* 📊 STATS */}
        <Card>
          <h3 className="font-semibold mb-3">📊 Sessions</h3>

          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500">No sessions yet</p>
          ) : (
            sessions.map((s, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span>{s.type}</span>
                <span>{s.duration / 60} min</span>
              </div>
            ))
          )}
        </Card>

      </div>
    </div>
  );
}