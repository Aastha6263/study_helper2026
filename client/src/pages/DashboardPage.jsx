import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckSquare,
  Star,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Zap,
  BookOpen,
  Plus,
  ArrowRight,
  Target,
  Award,
  ChevronUp,
  Download,
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studyAPI, taskAPI } from '../services/api';
import useAuth from '../hooks/useAuth';

// ─── Constants ───────────────────────────────────────────────────
const FOCUS_MINS = 25;
const BREAK_MINS = 5;

const LEVEL_NAMES = [
  'Beginner',
  'Learner',
  'Student',
  'Scholar',
  'Expert',
  'Master',
  'Legend',
];
const getLevelName = (lvl) =>
  LEVEL_NAMES[Math.min(lvl - 1, LEVEL_NAMES.length - 1)];
const getLevel = (xp) => Math.floor(xp / 500) + 1;
const getLevelXP = (xp) => ({
  curr: xp % 500,
  next: 500,
  pct: Math.round(((xp % 500) / 500) * 100),
});

const LEADERBOARD = [
  {
    initials: 'RK',
    name: 'Rahul K.',
    xp: 3120,
    bg: '#2a1500',
    color: '#EF9F27',
  },
  {
    initials: 'PJ',
    name: 'Priya J.',
    xp: 2980,
    bg: '#1a2030',
    color: '#b0b0b0',
  },
  {
    initials: 'AS',
    name: 'Ankit S.',
    xp: 2610,
    bg: '#1a2030',
    color: '#6b7280',
  },
  {
    initials: 'NK',
    name: 'Neha K.',
    xp: 2300,
    bg: '#1a2030',
    color: '#6b7280',
  },
];

const RANK_COLORS = { 1: '#EF9F27', 2: '#c0c0c0', 3: '#cd7f32' };

// ─── Styles ───────────────────────────────────────────────────────
const c = {
  bg: '#C9CECA',
  surface: '#F4F6F3',
  border: '#AAB5AE',
  text: '#0F4D43',
  muted: '#5E746B',
  teal: '#0F4D43',
  amber: '#1D5C50',
  red: '#C65F5F',
  purple: '#6C8F84',
};

const card = {
  background: 'rgba(244,246,243,0.88)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: `1px solid ${c.border}`,
  borderRadius: 22,
  padding: '1.2rem',
  boxShadow: '0 12px 35px rgba(15,77,67,0.08)',
  transition: 'all 0.3s ease',
};

const cardTitle = {
  fontSize: 14,
  fontWeight: 800,
  color: c.text,
  marginBottom: 14,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  letterSpacing: '0.3px',
};

// ─── Small Components ─────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accentBg, accentColor, to }) {
  const content = (
    <div
      style={{
        ...card,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: to ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = accentColor)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = c.border)}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: accentBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={accentColor} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.text }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  );
  return to ? (
    <Link to={to} style={{ textDecoration: 'none' }}>
      {content}
    </Link>
  ) : (
    content
  );
}

function XPBar({ pct, color = c.teal, label }) {
  return (
    <div>
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: c.muted,
            marginBottom: 3,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          height: 6,
          background: 'rgba(255,255,255,0.65)',
          borderRadius: 3,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(pct, 100)}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle }) {
  const overdue =
    !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    : '';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: `1px solid #252a38`,
      }}
    >
      <div
        onClick={() => onToggle(task._id)}
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: `1.8px solid ${task.completed ? c.teal : '#7e8f88'}`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: task.completed ? c.teal : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        {task.completed && (
          <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>
            ✓
          </span>
        )}
      </div>
      <span
        style={{
          flex: 1,
          fontSize: 13,
          color: task.completed ? c.muted : c.text,
          textDecoration: task.completed ? 'line-through' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {task.title}
      </span>
      {dueLabel && (
        <span
          style={{
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 20,
            fontWeight: 500,
            background: overdue
              ? '#3a0808'
              : task.completed
                ? '#0d2318'
                : '#1a1f2e',
            color: overdue ? '#f87171' : task.completed ? '#34d399' : c.muted,
          }}
        >
          {overdue ? '⚠ Overdue' : dueLabel}
        </span>
      )}
    </div>
  );
}

function HeatMap({ data }) {
  const levels = ['#E6ECE8', '#B7C8BF', '#5E8B7E', '#0F4D43'];
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7,1fr)',
          gap: 3,
          marginTop: 6,
        }}
      >
        {data.map((v, i) => (
          <div
            key={i}
            title={`${v} sessions`}
            style={{
              height: 12,
              borderRadius: 2,
              background: levels[Math.min(v, 3)],
              cursor: 'default',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          />
        ))}
      </div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}
      >
        <span style={{ fontSize: 10, color: c.muted }}>Less</span>
        {levels.map((l, i) => (
          <div
            key={i}
            style={{ width: 10, height: 10, borderRadius: 2, background: l }}
          />
        ))}
        <span style={{ fontSize: 10, color: c.muted }}>More</span>
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        height: 130,
        paddingTop: 4,
      }}
    >
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const pct = Math.round((d.minutes / max) * 100);
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              height: '100%',
              justifyContent: 'flex-end',
            }}
          >
            <div
              title={`${Math.round(d.minutes)} min`}
              style={{
                width: '100%',
                height: `${Math.max(pct, 2)}%`,
                background: isLast ? c.teal : '#B7C8BF',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.4s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isLast
                  ? '#0F6E56'
                  : '#3a4560';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isLast ? c.teal : '#2a3550';
              }}
            />
            <span style={{ fontSize: 10, color: c.muted }}>{d.date}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pomodoro Timer ───────────────────────────────────────────────
function PomodoroTimer() {
  const [seconds, setSeconds] = useState(FOCUS_MINS * 60);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  const total = (isBreak ? BREAK_MINS : FOCUS_MINS) * 60;
  const pct = Math.round(((total - seconds) / total) * 100);
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  const radius = 38,
    stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const tick = useCallback(() => {
    setSeconds((s) => {
      if (s <= 1) {
        clearInterval(intervalRef.current);
        setRunning(false);
        if (!isBreak) {
          setSessions((n) => n + 1);
          setIsBreak(true);
          return BREAK_MINS * 60;
        } else {
          setIsBreak(false);
          return FOCUS_MINS * 60;
        }
      }
      return s - 1;
    });
  }, [isBreak]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running, tick]);

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setIsBreak(false);
    setSeconds(FOCUS_MINS * 60);
  };

  return (
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: c.muted, marginBottom: 8 }}>
        {isBreak ? 'Break time!' : 'Pomodoro — Focus session'}
      </div>
      <svg
        width="90"
        height="90"
        style={{ display: 'block', margin: '0 auto 8px' }}
      >
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke="#252a38"
          strokeWidth={stroke}
        />
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke={isBreak ? c.amber : c.teal}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x="45"
          y="49"
          textAnchor="middle"
          fill={c.text}
          fontSize="16"
          fontWeight="700"
          fontFamily="monospace"
        >
          {mins}:{secs}
        </text>
      </svg>
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginTop: 4,
        }}
      >
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '7px 18px',
            borderRadius: 8,
            border: 'none',
            background: running ? c.red : c.teal,
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {running ? (
            <>
              <Pause size={13} /> Pause
            </>
          ) : (
            <>
              <Play size={13} />{' '}
              {seconds === FOCUS_MINS * 60 ? 'Start' : 'Resume'}
            </>
          )}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '7px 12px',
            borderRadius: 8,
            border: `1px solid ${c.border}`,
            background: 'transparent',
            color: c.muted,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={13} />
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          marginTop: 12,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: c.teal }}>
            {sessions}
          </div>
          <div style={{ fontSize: 10, color: c.muted }}>Sessions</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: c.amber }}>5</div>
          <div style={{ fontSize: 10, color: c.muted }}>Streak</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: c.purple }}>
            {sessions * FOCUS_MINS}
          </div>
          <div style={{ fontSize: 10, color: c.muted }}>Minutes</div>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Report Generator ─────────────────────────────────────────
async function generatePDFReport({
  user,
  analytics,
  tasks,
  totalXP,
  level,
  lvlName,
  lvlXP,
  chartData,
  heatData,
  weekTotal,
  overdueCount,
  goalPct,
}) {
  // Dynamically load libs
  const loadScript = (src) =>
    new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        res();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });

  await Promise.all([
    loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    ),
    loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    ),
  ]);

  const { jsPDF } = window.jspdf;

  // Build offscreen report DOM
  const container = document.createElement('div');
  container.style.cssText = `
    width: 900px;
    background: #F4F6F3;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #0F4D43;
    padding: 40px;
    position: fixed;
    left: -9999px;
    top: 0;
  `;

  const heatColors = ['#E6ECE8', '#B7C8BF', '#5E8B7E', '#0F4D43'];
  const chartMax = Math.max(...chartData.map((d) => d.minutes), 1);
  const completedCount = tasks.filter((t) => t.completed).length;
  const meInitials =
    (user?.name?.[0] || 'T') + (user?.name?.split(' ')[1]?.[0] || 'S');
  const board = [
    { initials: 'RK', name: 'Rahul K.', xp: 3120 },
    { initials: 'PJ', name: 'Priya J.', xp: 2980 },
    { initials: 'AS', name: 'Ankit S.', xp: 2610 },
    { initials: 'NK', name: 'Neha K.', xp: 2300 },
    { initials: meInitials, name: 'You', xp: totalXP, isMe: true },
  ]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);
  const medals = ['🥇', '🥈', '🥉'];

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  container.innerHTML = `
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #AAB5AE;">
      <div>
        <div style="font-size:28px;font-weight:800;color:#0F4D43;letter-spacing:-0.5px;">📚 StudyDash</div>
        <div style="font-size:14px;color:#5E746B;margin-top:4px;">Academic Progress Report</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:13px;font-weight:600;color:#0F4D43;">${user?.name || 'Student'}</div>
        <div style="font-size:11px;color:#5E746B;margin-top:2px;">${today}</div>
        <div style="margin-top:8px;background:#0F4D43;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block;">Level ${level} · ${lvlName}</div>
      </div>
    </div>

    <!-- Stat Cards Row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
      ${[
        {
          label: 'Study Time Today',
          value: `${Math.floor((analytics?.dailyStats?.[analytics.dailyStats.length - 1]?.totalMinutes || 260) / 60)}h ${(analytics?.dailyStats?.[analytics.dailyStats.length - 1]?.totalMinutes || 260) % 60}m`,
          accent: '#0F4D43',
          bg: '#E6ECE8',
        },
        {
          label: 'Tasks Completed',
          value: completedCount,
          accent: '#0F4D43',
          bg: '#E6ECE8',
        },
        {
          label: 'Total XP Earned',
          value: totalXP.toLocaleString(),
          accent: '#854F0B',
          bg: '#FAEEDA',
        },
        {
          label: 'Overdue Tasks',
          value: overdueCount,
          accent: '#A32D2D',
          bg: '#FCEBEB',
        },
      ]
        .map(
          (s) => `
        <div style="background:#fff;border-radius:14px;padding:16px;border:1px solid #AAB5AE;">
          <div style="width:36px;height:36px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;font-size:16px;margin-bottom:10px;">●</div>
          <div style="font-size:22px;font-weight:800;color:${s.accent};">${s.value}</div>
          <div style="font-size:11px;color:#5E746B;margin-top:3px;">${s.label}</div>
        </div>
      `,
        )
        .join('')}
    </div>

    <!-- Chart + Tasks -->
    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:12px;margin-bottom:24px;">
      <!-- Bar Chart -->
      <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #AAB5AE;">
        <div style="font-size:13px;font-weight:800;color:#0F4D43;margin-bottom:16px;">Study Activity — Last 7 Days</div>
        <div style="display:flex;align-items:flex-end;gap:6px;height:120px;">
          ${chartData
            .map((d, i) => {
              const pct = Math.round((d.minutes / chartMax) * 100);
              return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end;">
                <div style="font-size:9px;color:#5E746B;font-weight:600;">${d.minutes}m</div>
                <div style="width:100%;height:${Math.max(pct, 2)}%;background:${i === chartData.length - 1 ? '#0F4D43' : '#B7C8BF'};border-radius:4px 4px 0 0;"></div>
                <span style="font-size:9px;color:#5E746B;">${d.date}</span>
              </div>`;
            })
            .join('')}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:10px;">
          <span style="font-size:11px;color:#5E746B;">Week total: <strong style="color:#0F4D43;">${weekTotal}h</strong></span>
          <span style="font-size:11px;color:#0F4D43;font-weight:600;">↑ +12% vs last week</span>
        </div>
      </div>

      <!-- Tasks -->
      <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #AAB5AE;">
        <div style="font-size:13px;font-weight:800;color:#0F4D43;margin-bottom:16px;">Today's Tasks</div>
        ${tasks
          .slice(0, 6)
          .map((t) => {
            const overdue =
              !t.completed && t.dueDate && new Date(t.dueDate) < new Date();
            const dueLabel = t.dueDate
              ? new Date(t.dueDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })
              : '';
            const tagBg = overdue
              ? '#FCEBEB'
              : t.completed
                ? '#E6ECE8'
                : '#F1EFE8';
            const tagColor = overdue
              ? '#A32D2D'
              : t.completed
                ? '#0F6E56'
                : '#5E746B';
            const tagText = overdue
              ? '⚠ Overdue'
              : t.completed
                ? '✓ Done'
                : dueLabel;
            return `
            <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #E6ECE8;">
              <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid ${t.completed ? '#0F4D43' : '#AAB5AE'};background:${t.completed ? '#0F4D43' : 'transparent'};display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;flex-shrink:0;">${t.completed ? '✓' : ''}</div>
              <span style="flex:1;font-size:12px;color:${t.completed ? '#5E746B' : '#0F4D43'};text-decoration:${t.completed ? 'line-through' : 'none'};">${t.title}</span>
              ${tagText ? `<span style="font-size:9px;padding:2px 7px;border-radius:20px;background:${tagBg};color:${tagColor};font-weight:600;">${tagText}</span>` : ''}
            </div>`;
          })
          .join('')}
      </div>
    </div>

    <!-- XP + Leaderboard + Pomodoro -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
      <!-- XP Card -->
      <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #AAB5AE;">
        <div style="font-size:13px;font-weight:800;color:#0F4D43;margin-bottom:14px;">XP &amp; Level</div>
        <div style="text-align:center;margin-bottom:14px;">
          <div style="font-size:36px;font-weight:900;color:#854F0B;">Lv.${level}</div>
          <div style="font-size:11px;color:#5E746B;">${lvlName}</div>
        </div>
        <div style="font-size:10px;color:#5E746B;display:flex;justify-content:space-between;margin-bottom:3px;"><span>${lvlXP.curr} XP</span><span>${lvlXP.next} XP</span></div>
        <div style="height:6px;background:#E6ECE8;border-radius:3px;margin-bottom:4px;">
          <div style="height:100%;width:${lvlXP.pct}%;background:#BA7517;border-radius:3px;"></div>
        </div>
        <div style="font-size:10px;color:#5E746B;text-align:center;margin-bottom:14px;">${lvlXP.next - lvlXP.curr} XP to Level ${level + 1}</div>

        <div style="font-size:11px;color:#5E746B;display:flex;justify-content:space-between;margin-bottom:3px;"><span>Daily goal</span><span style="color:#0F4D43;font-weight:700;">${goalPct}%</span></div>
        <div style="height:6px;background:#E6ECE8;border-radius:3px;margin-bottom:12px;">
          <div style="height:100%;width:${goalPct}%;background:#6C8F84;border-radius:3px;"></div>
        </div>

        <div style="font-size:11px;color:#5E746B;margin-bottom:4px;">Focus score today</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;font-weight:800;color:#0F4D43;">82%</span>
          <div style="flex:1;">
            <div style="height:6px;background:#E6ECE8;border-radius:3px;">
              <div style="height:100%;width:82%;background:#0F4D43;border-radius:3px;"></div>
            </div>
            <div style="font-size:9px;color:#5E746B;margin-top:2px;">Great focus!</div>
          </div>
        </div>
      </div>

      <!-- Leaderboard -->
      <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #AAB5AE;">
        <div style="font-size:13px;font-weight:800;color:#0F4D43;margin-bottom:14px;">Leaderboard — This Week</div>
        ${board
          .map(
            (p, i) => `
          <div style="display:flex;align-items:center;gap:8px;padding:7px ${p.isMe ? '8px' : '0'};border-radius:${p.isMe ? '8px' : '0'};margin-bottom:4px;background:${p.isMe ? '#E6ECE8' : 'transparent'};border:${p.isMe ? '1px solid #AAB5AE' : '1px solid transparent'};">
            <span style="font-size:14px;width:22px;flex-shrink:0;text-align:center;">${i < 3 ? medals[i] : i + 1}</span>
            <div style="width:26px;height:26px;border-radius:50%;background:${p.isMe ? '#0F4D43' : '#E6ECE8'};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${p.isMe ? '#fff' : '#5E746B'};flex-shrink:0;">${p.initials}</div>
            <span style="flex:1;font-size:12px;color:#0F4D43;font-weight:${p.isMe ? 700 : 400};">${p.name}</span>
            <span style="font-size:11px;font-weight:700;color:#854F0B;">${p.xp.toLocaleString()}</span>
          </div>
        `,
          )
          .join('')}
      </div>

      <!-- Pomodoro Summary -->
      <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #AAB5AE;">
        <div style="font-size:13px;font-weight:800;color:#0F4D43;margin-bottom:14px;">Pomodoro Sessions</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
          ${[
            { val: '4', lbl: 'Sessions', color: '#0F4D43' },
            { val: '5', lbl: 'Day streak', color: '#854F0B' },
            { val: '100', lbl: 'Minutes', color: '#6C8F84' },
          ]
            .map(
              (s) => `
            <div style="text-align:center;padding:10px;background:#F4F6F3;border-radius:10px;">
              <div style="font-size:20px;font-weight:800;color:${s.color};">${s.val}</div>
              <div style="font-size:9px;color:#5E746B;margin-top:2px;">${s.lbl}</div>
            </div>
          `,
            )
            .join('')}
        </div>
        <div style="background:#F4F6F3;border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:10px;color:#5E746B;margin-bottom:4px;">Next session</div>
          <div style="font-size:24px;font-weight:800;font-family:monospace;color:#0F4D43;letter-spacing:1px;">25:00</div>
          <div style="font-size:10px;color:#5E746B;margin-top:4px;">Focus · Ready</div>
        </div>
      </div>
    </div>

    <!-- Heatmap -->
    <div style="background:#fff;border-radius:14px;padding:20px;border:1px solid #AAB5AE;">
      <div style="font-size:13px;font-weight:800;color:#0F4D43;margin-bottom:14px;">Study Heatmap — This Month</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
        ${heatData.map((v) => `<div style="height:14px;border-radius:3px;background:${heatColors[Math.min(v, 3)]};"></div>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:10px;">
        <span style="font-size:10px;color:#5E746B;">Less</span>
        ${heatColors.map((l) => `<div style="width:10px;height:10px;border-radius:2px;background:${l};"></div>`).join('')}
        <span style="font-size:10px;color:#5E746B;">More</span>
        <span style="margin-left:auto;font-size:11px;color:#5E746B;">
          Week: <strong style="color:#0F4D43;">${weekTotal}h</strong> ·
          Streak: <strong style="color:#0F4D43;">5 days</strong> ·
          Total: <strong style="color:#0F4D43;">${Math.round((analytics?.summary?.totalMinutes || 0) / 60) || 68}h</strong>
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #AAB5AE;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:10px;color:#5E746B;">Generated by StudyDash · ${today}</span>
      <span style="font-size:10px;color:#5E746B;">Confidential — Student Academic Report</span>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await window.html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#F4F6F3',
      logging: false,
      width: 900,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableW = pageW - margin * 2;
    const ratio = usableW / canvas.width;
    const scaledH = canvas.height * ratio;

    let srcY = 0;
    let destY = margin;
    let pageNo = 1;

    while (srcY < canvas.height) {
      const sliceHpx = Math.floor((pageH - margin * 2) / ratio);
      const actualH = Math.min(sliceHpx, canvas.height - srcY);

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = actualH;
      slice
        .getContext('2d')
        .drawImage(
          canvas,
          0,
          srcY,
          canvas.width,
          actualH,
          0,
          0,
          canvas.width,
          actualH,
        );

      if (pageNo > 1) {
        pdf.addPage();
        destY = margin;
      }

      pdf.addImage(
        slice.toDataURL('image/png'),
        'PNG',
        margin,
        destY,
        usableW,
        actualH * ratio,
      );
      srcY += actualH;
      pageNo++;
    }

    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Page ${i} of ${totalPages}  ·  StudyDash Academic Report`,
        margin,
        pageH - 4,
      );
    }

    pdf.save(`StudyDash_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

// ─── Main Dashboard ───────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [goalPct, setGoalPct] = useState(72);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          studyAPI.getAnalytics({ period: 7 }),
          taskAPI.getAll(),
        ]);
        setAnalytics(r1.data.analytics);
        setTasks(r2.data.tasks);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === id ? { ...t, completed: !t.completed } : t)),
    );
  }, []);

  const totalXP = analytics?.summary?.totalXP || 2840;
  const level = getLevel(totalXP);
  const lvlName = getLevelName(level);
  const lvlXP = getLevelXP(totalXP);
  const totalMins = analytics?.summary?.totalMinutes || 0;
  const todayMins =
    analytics?.dailyStats?.[analytics.dailyStats.length - 1]?.totalMinutes ||
    260;

  const chartData = analytics?.dailyStats?.map((d, i) => ({
    date: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7],
    minutes: d.totalMinutes,
  })) || [
    { date: 'Mon', minutes: 120 },
    { date: 'Tue', minutes: 180 },
    { date: 'Wed', minutes: 90 },
    { date: 'Thu', minutes: 240 },
    { date: 'Fri', minutes: 200 },
    { date: 'Sat', minutes: 280 },
    { date: 'Sun', minutes: 260 },
  ];

  const weekTotal =
    Math.round((chartData.reduce((s, d) => s + d.minutes, 0) / 60) * 10) / 10;
  const overdueCount = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date(),
  ).length;
  const heatData = Array.from({ length: 35 }, () =>
    Math.floor(Math.random() * 4),
  );
  const totalHours = `${Math.floor(todayMins / 60)}h ${todayMins % 60}m`;
  const me = {
    initials:
      (user?.name?.[0] || 'T') + (user?.name?.split(' ')[1]?.[0] || 'S'),
    name: 'You',
    xp: totalXP,
    bg: '#0d2318',
    color: c.teal,
    isMe: true,
  };
  const board = [...LEADERBOARD, me].sort((a, b) => b.xp - a.xp).slice(0, 5);

  // ── Download handler ──
  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generatePDFReport({
        user,
        analytics,
        tasks,
        totalXP,
        level,
        lvlName,
        lvlXP,
        chartData,
        heatData,
        weekTotal,
        overdueCount,
        goalPct,
      });
      toast.success('Report downloaded!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };

  const txt = {
    fontFamily: 'Inter, SF Pro Display, system-ui, sans-serif',
    color: c.text,
  };

  return (
    <div
      style={{
        ...txt,
        background: 'rgba(244,246,243,0.7)',
        backdropFilter: 'blur(12px)',
        padding: '1rem 1.2rem',
        borderRadius: '22px',
        border: `1px solid ${c.border}`,
        boxShadow: '0 8px 25px rgba(15,77,67,0.05)',
      }}
    >
      {/* ── Top Bar ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: c.text }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋
          </div>
          <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}{' '}
            · Keep your streak alive!
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* ── Download Report Button ── */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              borderRadius: 10,
              border: `1px solid ${c.border}`,
              background: downloading ? '#E6ECE8' : c.teal,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: downloading ? 'not-allowed' : 'pointer',
              opacity: downloading ? 0.8 : 1,
              transition: 'all 0.2s',
              letterSpacing: '0.2px',
            }}
            onMouseEnter={(e) => {
              if (!downloading) e.currentTarget.style.background = '#0a3d35';
            }}
            onMouseLeave={(e) => {
              if (!downloading) e.currentTarget.style.background = c.teal;
            }}
          >
            {downloading ? (
              <>
                <Loader
                  size={13}
                  style={{ animation: 'spin 1s linear infinite' }}
                />{' '}
                Generating...
              </>
            ) : (
              <>
                <Download size={13} /> Download Report
              </>
            )}
          </button>

          <div
            style={{
              fontSize: 12,
              color: c.muted,
              background: c.surface,
              padding: '6px 12px',
              borderRadius: 20,
              border: `1px solid ${c.border}`,
            }}
          >
            Level {level} · {lvlName} <span style={{ color: c.amber }}>★</span>
          </div>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: c.teal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {me.initials}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 10,
          marginBottom: '1rem',
        }}
      >
        <StatCard
          icon={Clock}
          label="Study time today"
          value={totalHours}
          accentBg="rgba(15,77,67,0.12)"
          accentColor="#0F4D43"
          to="/analytics"
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks completed"
          value={tasks.filter((t) => t.completed).length}
          accentBg="rgba(15,77,67,0.10)"
          accentColor="#0F4D43"
          to="/tasks"
        />
        <StatCard
          icon={Star}
          label="Total XP"
          value={totalXP.toLocaleString()}
          accentBg="rgba(92,58,14,0.10)"
          accentColor="#5B3A0E"
        />
        <StatCard
          icon={AlertCircle}
          label="Overdue tasks"
          value={overdueCount}
          accentBg="rgba(198,95,95,0.10)"
          accentColor="#B54747"
          to="/tasks"
        />
      </div>

      {/* ── Chart + Tasks ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 10,
          marginBottom: '1rem',
        }}
      >
        <div style={card}>
          <div style={cardTitle}>
            Study activity — last 7 days
            <Link
              to="/analytics"
              style={{ fontSize: 11, color: c.teal, textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>
          {loading ? (
            <div
              style={{
                height: 130,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: c.muted,
                fontSize: 13,
              }}
            >
              Loading...
            </div>
          ) : (
            <BarChart data={chartData} />
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 11, color: c.muted }}>
              Week total:{' '}
              <strong style={{ color: c.text }}>{weekTotal}h</strong>
            </span>
            <span style={{ fontSize: 11, color: c.teal }}>
              ↑ +12% vs last week
            </span>
          </div>
        </div>

        <div style={card}>
          <div style={cardTitle}>
            Today's tasks
            <Link
              to="/tasks"
              style={{
                fontSize: 11,
                color: c.teal,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Plus size={11} />
              Add
            </Link>
          </div>
          {tasks.length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: c.muted,
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              No tasks yet
            </div>
          ) : (
            tasks
              .slice(0, 5)
              .map((t) => (
                <TaskItem key={t._id} task={t} onToggle={toggleTask} />
              ))
          )}
          {tasks.length > 5 && (
            <Link
              to="/tasks"
              style={{
                fontSize: 11,
                color: c.teal,
                textDecoration: 'none',
                display: 'block',
                marginTop: 8,
              }}
            >
              +{tasks.length - 5} more tasks →
            </Link>
          )}
        </div>
      </div>

      {/* ── Pomodoro + XP/Level + Leaderboard ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 10,
          marginBottom: '1rem',
        }}
      >
        <PomodoroTimer />

        <div style={card}>
          <div style={cardTitle}>XP & Level</div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: c.amber }}>
              Lv.{level}
            </div>
            <div style={{ fontSize: 11, color: c.muted }}>{lvlName}</div>
          </div>
          <XPBar
            pct={lvlXP.pct}
            color={c.amber}
            label={[`${lvlXP.curr} XP`, `${lvlXP.next} XP`]}
          />
          <div
            style={{
              fontSize: 10,
              color: c.muted,
              marginTop: 4,
              textAlign: 'center',
            }}
          >
            {lvlXP.next - lvlXP.curr} XP to Level {level + 1} ·{' '}
            {getLevelName(level + 1)}
          </div>
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: c.muted,
                marginBottom: 6,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Daily goal</span>
              <span style={{ color: c.teal }}>{goalPct}%</span>
            </div>
            <XPBar pct={goalPct} color={c.purple} />
            <div style={{ fontSize: 10, color: c.purple, marginTop: 3 }}>
              {Math.round((goalPct / 100) * 5 * 60)} min of 5h goal completed
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: c.muted, marginBottom: 6 }}>
              Focus score today
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: c.teal }}>
                82%
              </span>
              <div style={{ flex: 1 }}>
                <XPBar pct={82} color={c.teal} />
                <div style={{ fontSize: 10, color: c.muted, marginTop: 3 }}>
                  Great focus!
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={cardTitle}>
            Leaderboard — this week
            <span style={{ fontSize: 10, color: c.amber }}>Top 5</span>
          </div>
          {board.map((player, i) => {
            const rank = i + 1;
            return (
              <div
                key={player.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 8px',
                  borderRadius: 8,
                  marginBottom: 4,
                  background: player.isMe ? '#0d1f16' : 'transparent',
                  border: player.isMe
                    ? `1px solid ${c.teal}`
                    : '1px solid transparent',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: RANK_COLORS[rank] || c.muted,
                    width: 20,
                    flexShrink: 0,
                  }}
                >
                  {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
                </span>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: player.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    color: player.color,
                    flexShrink: 0,
                  }}
                >
                  {player.initials}
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: player.isMe ? '#fff' : '#d1d5db',
                    fontWeight: player.isMe ? 600 : 400,
                  }}
                >
                  {player.name}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: c.amber }}>
                  {player.xp.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Heatmap + Quick Actions ── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 10 }}
      >
        <div style={card}>
          <div style={cardTitle}>Study heatmap — this month</div>
          <HeatMap data={heatData} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: c.teal }}>
                {weekTotal}h
              </div>
              <div style={{ fontSize: 10, color: c.muted }}>This week</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: c.amber }}>
                5
              </div>
              <div style={{ fontSize: 10, color: c.muted }}>Day streak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: c.purple }}>
                {Math.round(totalMins / 60) || 68}h
              </div>
              <div style={{ fontSize: 10, color: c.muted }}>Total hours</div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={cardTitle}>Quick actions</div>
          {[
            {
              icon: Play,
              label: 'Start study session',
              to: '/study-session',
              color: c.teal,
            },
            {
              icon: Plus,
              label: 'Add new task',
              to: '/tasks',
              color: c.purple,
            },
            { icon: Zap, label: 'Ask AI tutor', to: '/ai', color: c.amber },
            {
              icon: BookOpen,
              label: 'View timetable',
              to: '/timetable',
              color: c.text,
            },
            {
              icon: TrendingUp,
              label: 'Analytics',
              to: '/analytics',
              color: c.text,
            },
          ].map(({ icon: Icon, label, to, color }) => (
            <Link key={label} to={to} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 10px',
                  borderRadius: 10,
                  marginBottom: 4,
                  background: '#252a38',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#2e3450')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = '#252a38')
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={13} color={color} />
                  <span style={{ fontSize: 12, color: '#d1d5db' }}>
                    {label}
                  </span>
                </div>
                <ArrowRight size={12} color={c.muted} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DashboardPage;
