import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  BookOpen,
  Code,
  Music,
  Dumbbell,
  Briefcase,
  Beaker,
} from 'lucide-react';

const SUBJECT_ICONS = {
  study: BookOpen,
  code: Code,
  music: Music,
  fitness: Dumbbell,
  work: Briefcase,
  science: Beaker,
};

const SUBJECT_COLORS = {
  study: {
    bg: 'bg-violet-50',
    ring: 'ring-violet-400',
    text: 'text-violet-700',
    dot: 'bg-violet-400',
    bar: 'bg-violet-400',
  },
  code: {
    bg: 'bg-sky-50',
    ring: 'ring-sky-400',
    text: 'text-sky-700',
    dot: 'bg-sky-400',
    bar: 'bg-sky-400',
  },
  music: {
    bg: 'bg-pink-50',
    ring: 'ring-pink-400',
    text: 'text-pink-700',
    dot: 'bg-pink-400',
    bar: 'bg-pink-400',
  },
  fitness: {
    bg: 'bg-orange-50',
    ring: 'ring-orange-400',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
    bar: 'bg-orange-400',
  },
  work: {
    bg: 'bg-teal-50',
    ring: 'ring-teal-400',
    text: 'text-teal-700',
    dot: 'bg-teal-400',
    bar: 'bg-teal-400',
  },
  science: {
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-400',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-400',
  },
};

const DEFAULT_SUBJECTS = [
  {
    id: 1,
    name: 'Deep Study',
    icon: 'study',
    focusMin: 25,
    shortMin: 5,
    longMin: 15,
  },
  {
    id: 2,
    name: 'Coding',
    icon: 'code',
    focusMin: 50,
    shortMin: 10,
    longMin: 20,
  },
  {
    id: 3,
    name: 'Quick Review',
    icon: 'science',
    focusMin: 15,
    shortMin: 3,
    longMin: 10,
  },
];

const format = (s) => {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
};

const uid = () => Date.now() + Math.random();

export default function PomodoroPage() {
  const [subjects, setSubjects] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('pomo_subjects'));
      return s?.length ? s : DEFAULT_SUBJECTS;
    } catch {
      return DEFAULT_SUBJECTS;
    }
  });

  const [activeId, setActiveId] = useState(subjects[0]?.id ?? null);
  const [mode, setMode] = useState('focus'); // focus | short | long
  const [time, setTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [sessions, setSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pomo_sessions')) || [];
    } catch {
      return [];
    }
  });

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState({
    name: '',
    icon: 'study',
    focusMin: 25,
    shortMin: 5,
    longMin: 15,
  });

  const intervalRef = useRef(null);

  const activeSubject = subjects.find((s) => s.id === activeId) || subjects[0];
  const color = SUBJECT_COLORS[activeSubject?.icon] || SUBJECT_COLORS.study;

  const getModeSeconds = (subj, m) => {
    if (!subj) return 1500;
    if (m === 'focus') return subj.focusMin * 60;
    if (m === 'short') return subj.shortMin * 60;
    return subj.longMin * 60;
  };

  // Init time when subject or mode changes and timer not running
  useEffect(() => {
    if (!isRunning) setTime(getModeSeconds(activeSubject, mode));
  }, [activeId, mode]);

  useEffect(() => {
    if (time === null && activeSubject)
      setTime(getModeSeconds(activeSubject, mode));
  }, [activeSubject]);

  const handleNext = () => {
    if (mode === 'focus') {
      setSessions((prev) => {
        const next = [
          ...prev,
          {
            subjectId: activeId,
            subjectName: activeSubject?.name,
            duration: activeSubject?.focusMin,
            ts: Date.now(),
          },
        ];
        localStorage.setItem('pomo_sessions', JSON.stringify(next));
        return next;
      });
      const nextCycle = cycle + 1;
      setCycle(nextCycle);
      if (nextCycle % 4 === 0) {
        setMode('long');
        setTime(getModeSeconds(activeSubject, 'long'));
      } else {
        setMode('short');
        setTime(getModeSeconds(activeSubject, 'short'));
      }
    } else {
      setMode('focus');
      setTime(getModeSeconds(activeSubject, 'focus'));
    }
    setIsRunning(false);
  };

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((t) => {
          if (t <= 1) {
            handleNext();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode, activeId]);

  useEffect(() => {
    localStorage.setItem('pomo_subjects', JSON.stringify(subjects));
  }, [subjects]);

  const totalSeconds = getModeSeconds(activeSubject, mode);
  const progress =
    time !== null ? ((totalSeconds - time) / totalSeconds) * 100 : 0;

  const modeLabel =
    mode === 'focus'
      ? 'Focus'
      : mode === 'short'
        ? 'Short Break'
        : 'Long Break';

  // Grouped sessions per subject
  const sessionStats = subjects.map((s) => ({
    ...s,
    count: sessions.filter((x) => x.subjectId === s.id).length,
    totalMin: sessions
      .filter((x) => x.subjectId === s.id)
      .reduce((a, x) => a + (x.duration || 0), 0),
  }));

  const selectSubject = (id) => {
    if (isRunning) return;
    setActiveId(id);
    setMode('focus');
    setCycle(0);
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditDraft({
      name: s.name,
      icon: s.icon,
      focusMin: s.focusMin,
      shortMin: s.shortMin,
      longMin: s.longMin,
    });
  };

  const saveEdit = (id) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...editDraft } : s)),
    );
    if (id === activeId && !isRunning) setTime(editDraft.focusMin * 60);
    setEditingId(null);
  };

  const deleteSubject = (id) => {
    const next = subjects.filter((s) => s.id !== id);
    setSubjects(next);
    if (activeId === id && next.length) {
      setActiveId(next[0].id);
      setMode('focus');
    }
  };

  const saveNew = () => {
    if (!newDraft.name.trim()) return;
    const s = {
      ...newDraft,
      id: uid(),
      focusMin: +newDraft.focusMin || 25,
      shortMin: +newDraft.shortMin || 5,
      longMin: +newDraft.longMin || 15,
    };
    setSubjects((prev) => [...prev, s]);
    setAddingNew(false);
    setNewDraft({
      name: '',
      icon: 'study',
      focusMin: 25,
      shortMin: 5,
      longMin: 15,
    });
  };

  const clearSessions = () => {
    setSessions([]);
    localStorage.removeItem('pomo_sessions');
  };

  const IconComp = SUBJECT_ICONS[activeSubject?.icon] || BookOpen;

  const circumference = 2 * Math.PI * 54;
  const strokeDash = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white text-sm">
            🍅
          </div>
          <span className="font-semibold text-gray-800 tracking-tight">
            FocusFlow
          </span>
        </div>
        <span className="text-xs text-gray-400">Pomodoro Planner</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — subjects list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Subjects
            </p>
            <button
              onClick={() => setAddingNew(true)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Plus size={13} /> Add
            </button>
          </div>

          {subjects.map((s) => {
            const sc = SUBJECT_COLORS[s.icon] || SUBJECT_COLORS.study;
            const Icon = SUBJECT_ICONS[s.icon] || BookOpen;
            const isActive = s.id === activeId;

            if (editingId === s.id) {
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-sm"
                >
                  <input
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-300"
                    value={editDraft.name}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, name: e.target.value })
                    }
                    placeholder="Subject name"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {['focusMin', 'shortMin', 'longMin'].map((k) => (
                      <div key={k}>
                        <p className="text-[10px] text-gray-400 mb-0.5">
                          {k === 'focusMin'
                            ? 'Focus'
                            : k === 'shortMin'
                              ? 'Short'
                              : 'Long'}{' '}
                          (min)
                        </p>
                        <input
                          type="number"
                          min={1}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-300"
                          value={editDraft[k]}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, [k]: +e.target.value })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(SUBJECT_ICONS).map((ic) => {
                      const Ic = SUBJECT_ICONS[ic];
                      const icc = SUBJECT_COLORS[ic];
                      return (
                        <button
                          key={ic}
                          onClick={() =>
                            setEditDraft({ ...editDraft, icon: ic })
                          }
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${editDraft.icon === ic ? icc.bg + ' ring-2 ' + icc.ring : 'bg-gray-100'}`}
                        >
                          <Ic
                            size={13}
                            className={
                              editDraft.icon === ic ? icc.text : 'text-gray-400'
                            }
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(s.id)}
                      className="flex items-center gap-1 text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors"
                    >
                      <Check size={11} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X size={11} /> Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={s.id}
                onClick={() => selectSubject(s.id)}
                className={`w-full text-left bg-white rounded-2xl border transition-all duration-150 px-4 py-3 flex items-center gap-3 group shadow-sm hover:shadow-md
                  ${isActive ? 'border-gray-300 ring-2 ' + sc.ring : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.bg}`}
                >
                  <Icon size={16} className={sc.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {s.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.focusMin}m focus · {s.shortMin}m break
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(s);
                    }}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <Pencil size={12} className="text-gray-400" />
                  </span>
                  {subjects.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSubject(s.id);
                      }}
                      className="p-1 rounded hover:bg-red-50"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Add new subject */}
          {addingNew && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-sm">
              <input
                autoFocus
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-300"
                value={newDraft.name}
                onChange={(e) =>
                  setNewDraft({ ...newDraft, name: e.target.value })
                }
                placeholder="Subject name"
              />
              <div className="grid grid-cols-3 gap-2">
                {['focusMin', 'shortMin', 'longMin'].map((k) => (
                  <div key={k}>
                    <p className="text-[10px] text-gray-400 mb-0.5">
                      {k === 'focusMin'
                        ? 'Focus'
                        : k === 'shortMin'
                          ? 'Short'
                          : 'Long'}{' '}
                      (min)
                    </p>
                    <input
                      type="number"
                      min={1}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-300"
                      value={newDraft[k]}
                      onChange={(e) =>
                        setNewDraft({ ...newDraft, [k]: +e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(SUBJECT_ICONS).map((ic) => {
                  const Ic = SUBJECT_ICONS[ic];
                  const icc = SUBJECT_COLORS[ic];
                  return (
                    <button
                      key={ic}
                      onClick={() => setNewDraft({ ...newDraft, icon: ic })}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${newDraft.icon === ic ? icc.bg + ' ring-2 ' + icc.ring : 'bg-gray-100'}`}
                    >
                      <Ic
                        size={13}
                        className={
                          newDraft.icon === ic ? icc.text : 'text-gray-400'
                        }
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveNew}
                  className="flex items-center gap-1 text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors"
                >
                  <Check size={11} /> Add
                </button>
                <button
                  onClick={() => setAddingNew(false)}
                  className="flex items-center gap-1 text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={11} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CENTER — timer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timer card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
            {/* Mode tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 self-stretch justify-center">
              {[
                ['focus', 'Focus'],
                ['short', 'Short Break'],
                ['long', 'Long Break'],
              ].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => {
                    if (!isRunning) {
                      setMode(m);
                      setTime(getModeSeconds(activeSubject, m));
                    }
                  }}
                  className={`flex-1 text-xs py-1.5 px-3 rounded-lg font-medium transition-all
                    ${mode === m ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Circular progress */}
            <div className="relative w-44 h-44 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke={
                    mode === 'focus'
                      ? '#7c3aed'
                      : mode === 'short'
                        ? '#0ea5e9'
                        : '#a855f7'
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDash}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <IconComp size={18} className={`mb-1 ${color.text}`} />
                <span className="text-4xl font-bold tracking-tight text-gray-800">
                  {format(time ?? getModeSeconds(activeSubject, mode))}
                </span>
                <span className="text-xs text-gray-400 mt-0.5">
                  {modeLabel}
                </span>
              </div>
            </div>

            {/* Active subject label */}
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 ${color.bg}`}
            >
              <div className={`w-2 h-2 rounded-full ${color.dot}`} />
              <span className={`text-xs font-semibold ${color.text}`}>
                {activeSubject?.name}
              </span>
              <span className="text-xs text-gray-400">
                · Cycle {(cycle % 4) + 1}/4
              </span>
            </div>

            {/* Inline time editor for active subject */}
            {activeSubject && (
              <div className="flex items-center gap-3 mb-6 bg-gray-50 rounded-2xl px-5 py-3 border border-gray-100 w-full justify-center">
                {[
                  {
                    key: 'focusMin',
                    label: '🎯 Focus',
                    color: 'text-violet-600',
                  },
                  { key: 'shortMin', label: '☕ Short', color: 'text-sky-600' },
                  {
                    key: 'longMin',
                    label: '🧘 Long',
                    color: 'text-purple-600',
                  },
                ].map(({ key, label, color: c }) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={isRunning}
                        onClick={() => {
                          const cur = activeSubject[key];
                          if (cur <= 1) return;
                          setSubjects((prev) =>
                            prev.map((s) =>
                              s.id === activeId ? { ...s, [key]: cur - 1 } : s,
                            ),
                          );
                          if (
                            key === 'focusMin' &&
                            mode === 'focus' &&
                            !isRunning
                          )
                            setTime((cur - 1) * 60);
                          if (
                            key === 'shortMin' &&
                            mode === 'short' &&
                            !isRunning
                          )
                            setTime((cur - 1) * 60);
                          if (
                            key === 'longMin' &&
                            mode === 'long' &&
                            !isRunning
                          )
                            setTime((cur - 1) * 60);
                        }}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-500 text-sm font-bold flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={180}
                        disabled={isRunning}
                        value={activeSubject[key]}
                        onChange={(e) => {
                          const val = Math.max(
                            1,
                            Math.min(180, +e.target.value || 1),
                          );
                          setSubjects((prev) =>
                            prev.map((s) =>
                              s.id === activeId ? { ...s, [key]: val } : s,
                            ),
                          );
                          if (
                            key === 'focusMin' &&
                            mode === 'focus' &&
                            !isRunning
                          )
                            setTime(val * 60);
                          if (
                            key === 'shortMin' &&
                            mode === 'short' &&
                            !isRunning
                          )
                            setTime(val * 60);
                          if (
                            key === 'longMin' &&
                            mode === 'long' &&
                            !isRunning
                          )
                            setTime(val * 60);
                        }}
                        className={`w-10 text-center text-sm font-bold border-0 bg-transparent outline-none ${c} disabled:opacity-50`}
                      />
                      <button
                        disabled={isRunning}
                        onClick={() => {
                          const cur = activeSubject[key];
                          if (cur >= 180) return;
                          setSubjects((prev) =>
                            prev.map((s) =>
                              s.id === activeId ? { ...s, [key]: cur + 1 } : s,
                            ),
                          );
                          if (
                            key === 'focusMin' &&
                            mode === 'focus' &&
                            !isRunning
                          )
                            setTime((cur + 1) * 60);
                          if (
                            key === 'shortMin' &&
                            mode === 'short' &&
                            !isRunning
                          )
                            setTime((cur + 1) * 60);
                          if (
                            key === 'longMin' &&
                            mode === 'long' &&
                            !isRunning
                          )
                            setTime((cur + 1) * 60);
                        }}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-500 text-sm font-bold flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400">min</span>
                  </div>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsRunning(false);
                  setTime(getModeSeconds(activeSubject, mode));
                }}
                className="flex items-center gap-1.5 text-sm text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw size={14} /> Reset
              </button>

              <button
                onClick={() => setIsRunning((r) => !r)}
                className={`flex items-center gap-2 text-sm font-semibold px-8 py-2.5 rounded-xl text-white transition-all shadow-md
                  ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                      : 'bg-violet-600 hover:bg-violet-700 shadow-violet-200'
                  }`}
              >
                {isRunning ? (
                  <>
                    <Pause size={15} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={15} /> Start
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 text-sm text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <SkipForward size={14} /> Skip
              </button>
            </div>
          </div>

          {/* Stats card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">
                Session Stats
              </p>
              {sessions.length > 0 && (
                <button
                  onClick={clearSessions}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Complete a focus session to see stats here.
              </p>
            ) : (
              <div className="space-y-3">
                {sessionStats
                  .filter((s) => s.count > 0)
                  .map((s) => {
                    const sc = SUBJECT_COLORS[s.icon] || SUBJECT_COLORS.study;
                    const Icon = SUBJECT_ICONS[s.icon] || BookOpen;
                    const maxMin = Math.max(
                      ...sessionStats.map((x) => x.totalMin),
                      1,
                    );
                    return (
                      <div key={s.id}>
                        <div className="flex items-center gap-3 mb-1">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center ${sc.bg}`}
                          >
                            <Icon size={12} className={sc.text} />
                          </div>
                          <span className="text-xs font-medium text-gray-700 flex-1">
                            {s.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {s.count} session{s.count !== 1 ? 's' : ''} ·{' '}
                            {s.totalMin}m
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${sc.bar}`}
                            style={{ width: `${(s.totalMin / maxMin) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                <div className="pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                  <span>
                    Total sessions:{' '}
                    <strong className="text-gray-700">{sessions.length}</strong>
                  </span>
                  <span>
                    Total focus:{' '}
                    <strong className="text-gray-700">
                      {sessions.reduce((a, s) => a + (s.duration || 0), 0)}m
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
