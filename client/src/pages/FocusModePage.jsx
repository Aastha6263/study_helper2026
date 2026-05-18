import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Target,
  Clock,
  Flame,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const format = (s) => {
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
};

const TASKS = ['DSA Practice', 'Math Chapter', 'Revision', 'Mock Test'];

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: accent + '22',
        border: `1px solid ${accent}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={18} color={accent} />
    </div>
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: '#6b7280',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '2px 0 0',
          fontSize: 18,
          fontWeight: 600,
          color: '#f9fafb',
        }}
      >
        {value}
      </p>
    </div>
  </div>
);

export default function FocusModePage() {
  const [task, setTask] = useState('DSA Practice');
  const [customMinutes, setCustomMinutes] = useState(25);
  const [time, setTime] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('studyHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const intervalRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('studyHistory', JSON.stringify(history));
  }, [history]);

  const now = Date.now();
  const todayHours = history
    .filter(
      (s) => new Date(s.date).toDateString() === new Date().toDateString(),
    )
    .reduce((acc, curr) => acc + curr.duration, 0);
  const last24Hours = history
    .filter((s) => now - s.date <= 86400000)
    .reduce((acc, curr) => acc + curr.duration, 0);
  const totalHours = history.reduce((acc, curr) => acc + curr.duration, 0);

  const enterFullscreen = async () => {
    try {
      if (pageRef.current?.requestFullscreen)
        await pageRef.current.requestFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
    } catch {}
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {}
  };

  const start = async () => {
    const seconds = Number(customMinutes) * 60;
    if (!seconds || seconds <= 0) {
      toast.error('Enter valid study time');
      return;
    }
    setTime(seconds);
    setSessionActive(true);
    await enterFullscreen();
    setTimeout(() => setIsRunning(true), 300);
    toast.success('Focus Mode Started 🔥');
  };

  const pause = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };
  const resume = () => setIsRunning(true);

  const end = async () => {
    clearInterval(intervalRef.current);
    const totalSessionSeconds = Number(customMinutes) * 60;
    const studiedSeconds = totalSessionSeconds - time;
    if (studiedSeconds > 0) {
      const newSession = { task, duration: studiedSeconds, date: Date.now() };
      setHistory((prev) => {
        const updated = [...prev, newSession];
        localStorage.setItem('studyHistory', JSON.stringify(updated));
        return updated;
      });
    }
    setIsRunning(false);
    setSessionActive(false);
    await exitFullscreen();
    setTime(totalSessionSeconds);
    toast.success('Session Completed ✅');
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            toast.success('Take a break 😎');
            setTimeout(() => end(), 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && sessionActive) {
        toast.error('⚠️ Stay focused!');
        pause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [sessionActive]);

  useEffect(() => {
    const fullscreenChange = () => {
      if (!document.fullscreenElement && sessionActive) {
        toast.error('Focus Mode Ended');
        end();
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', fullscreenChange);
  }, [sessionActive, time]);

  const totalSessionSeconds = Number(customMinutes) * 60;
  const progress = sessionActive
    ? ((totalSessionSeconds - time) / totalSessionSeconds) * 100
    : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      ref={pageRef}
      style={{
        minHeight: '100vh',
        width: '100%',
        background: sessionActive
          ? 'radial-gradient(ellipse at 50% 0%, #0f172a 0%, #020617 100%)'
          : 'radial-gradient(ellipse at 30% 20%, #0f172a 0%, #020617 100%)',
        color: '#f9fafb',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: sessionActive ? 'center' : 'flex-start',
        padding: sessionActive ? 0 : '40px 20px 60px',
        boxSizing: 'border-box',
      }}
    >
      {/* AMBIENT ORBS */}
      {!sessionActive && (
        <>
          <div
            style={{
              position: 'fixed',
              top: -100,
              left: -100,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: -80,
              right: -80,
              width: 350,
              height: 350,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {!sessionActive ? (
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* HEADER */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 999,
                padding: '6px 16px',
              }}
            >
              <Target size={14} color="#a78bfa" />
              <span
                style={{
                  fontSize: 12,
                  color: '#a78bfa',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                }}
              >
                DEEP FOCUS
              </span>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#f9fafb',
              }}
            >
              Focus Mode
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280' }}>
              Eliminate distractions. Enter flow state.
            </p>
          </div>

          {/* STATS ROW */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
            }}
          >
            <StatCard
              icon={Clock}
              label="Today"
              value={`${(todayHours / 3600).toFixed(1)}h`}
              accent="#60a5fa"
            />
            <StatCard
              icon={Flame}
              label="24 hrs"
              value={`${(last24Hours / 3600).toFixed(1)}h`}
              accent="#f97316"
            />
            <StatCard
              icon={BookOpen}
              label="Total"
              value={`${(totalHours / 3600).toFixed(1)}h`}
              accent="#a78bfa"
            />
          </div>

          {/* CONFIG CARD */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* TASK SELECT */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: '#6b7280',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Task
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#f9fafb',
                    fontSize: 15,
                    fontWeight: 500,
                    appearance: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = 'rgba(139,92,246,0.5)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = 'rgba(255,255,255,0.12)')
                  }
                >
                  {TASKS.map((t) => (
                    <option key={t} value={t} style={{ background: '#0f172a' }}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  color="#6b7280"
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>

            {/* DIVIDER */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* DURATION */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: '#6b7280',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Duration (minutes)
              </label>

              {/* QUICK PRESETS */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}
              >
                {[15, 25, 45, 60, 90].map((m) => (
                  <button
                    key={m}
                    onClick={() => setCustomMinutes(m)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: `1px solid ${customMinutes == m ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      background:
                        customMinutes == m
                          ? 'rgba(139,92,246,0.2)'
                          : 'transparent',
                      color: customMinutes == m ? '#a78bfa' : '#6b7280',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              {/* CUSTOM INPUT */}
              <input
                type="number"
                min="1"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="Custom..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#f9fafb',
                  fontSize: 15,
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = 'rgba(139,92,246,0.5)')
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = 'rgba(255,255,255,0.12)')
                }
              />
            </div>
          </div>

          {/* START BUTTON */}
          <button
            onClick={start}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: 'none',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              letterSpacing: '0.01em',
              boxShadow:
                '0 0 40px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                '0 0 60px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.1)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow =
                '0 0 40px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.1)')
            }
          >
            <Play size={18} fill="#fff" />
            Start Focus Session
          </button>

          {/* HISTORY */}
          {history.length > 0 && (
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '24px',
              }}
            >
              <h2
                style={{
                  margin: '0 0 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#9ca3af',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Recent Sessions
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {history
                  .slice()
                  .reverse()
                  .map((session, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: 10,
                        background:
                          i === 0 ? 'rgba(139,92,246,0.08)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          'rgba(255,255,255,0.04)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          i === 0 ? 'rgba(139,92,246,0.08)' : 'transparent')
                      }
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#e5e7eb',
                          }}
                        >
                          {session.task}
                        </p>
                        <p
                          style={{
                            margin: '2px 0 0',
                            fontSize: 12,
                            color: '#6b7280',
                          }}
                        >
                          {new Date(session.date).toLocaleString()}
                        </p>
                      </div>
                      <div
                        style={{
                          background: 'rgba(99,102,241,0.15)',
                          border: '1px solid rgba(99,102,241,0.25)',
                          borderRadius: 8,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#818cf8',
                        }}
                      >
                        {Math.round(session.duration / 60)}m
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========= ACTIVE SESSION ========= */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 48,
            padding: '40px 20px',
            width: '100%',
            maxWidth: 500,
          }}
        >
          {/* TASK LABEL */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999,
              padding: '8px 20px',
            }}
          >
            <Target size={14} color="#a78bfa" />
            <span style={{ fontSize: 14, color: '#d1d5db', fontWeight: 500 }}>
              {task}
            </span>
          </div>

          {/* SVG RING TIMER */}
          <div style={{ position: 'relative', width: 280, height: 280 }}>
            <svg
              width="280"
              height="280"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Track */}
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
              />
              {/* Progress */}
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="url(#progressGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient
                  id="progressGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            {/* Timer Text */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: '#f9fafb',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {format(time)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}
              >
                {isRunning ? 'Focusing...' : 'Paused'}
              </span>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div style={{ width: '100%', maxWidth: 320 }}>
            <div
              style={{
                height: 4,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                  borderRadius: 999,
                  transition: 'width 1s linear',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#6b7280' }}>0:00</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {customMinutes}:00
              </span>
            </div>
          </div>

          {/* CONTROLS */}
          <div style={{ display: 'flex', gap: 16 }}>
            {isRunning ? (
              <button
                onClick={pause}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 28px',
                  borderRadius: 12,
                  background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  color: '#fbbf24',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(251,191,36,0.2)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(251,191,36,0.12)')
                }
              >
                <Pause size={18} /> Pause
              </button>
            ) : (
              <button
                onClick={resume}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 28px',
                  borderRadius: 12,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.35)',
                  color: '#818cf8',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')
                }
              >
                <Play size={18} fill="#818cf8" /> Resume
              </button>
            )}

            <button
              onClick={end}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 12,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')
              }
            >
              <Square size={18} /> End
            </button>
          </div>

          {/* STATUS DOT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isRunning ? '#10b981' : '#fbbf24',
                boxShadow: isRunning ? '0 0 12px #10b981' : '0 0 12px #fbbf24',
                animation: isRunning ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
              {isRunning ? 'Deep Focus Active' : 'Session Paused'}
            </span>
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
