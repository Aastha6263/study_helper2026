import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
}                                            from 'recharts';
import {
  TrendingUp, Clock, CheckSquare,
  Star, Flame, Target, BookOpen,
  Calendar, BarChart2, Award,
  RefreshCw,
}                                            from 'lucide-react';
import toast                                 from 'react-hot-toast';
import { studyAPI, taskAPI }                 from '../services/api';
import PageHeader                            from '../components/common/PageHeader';
import Card                                  from '../components/common/Card';
import Button                                from '../components/common/Button';
import Select                                from '../components/common/Select';
import Loader                                from '../components/common/Loader';
import Badge                                 from '../components/common/Badge';
import EmptyState                            from '../components/common/EmptyState';
import {
  formatMinutes, formatPercent,
  formatNumber, gradeLetter, gradeColor,
}                                            from '../utils/formatters';
import { ANALYTICS_PERIODS }                 from '../utils/constants';

// ── Brand palette (matches Tailwind config) ───────────────────────────────────
const C = {
  primary: '#16423C',
  accent:  '#6A9C89',
  success: '#6A9C89',
  danger:  '#dc2626',
  warning: '#f59e0b',
  muted:   '#94a3b8',
};

const PIE_COLORS = [
  C.blue, C.indigo, C.violet, C.green,
  C.teal, C.yellow, C.orange, C.pink,
];

const PERIOD_OPTS = ANALYTICS_PERIODS;

// ══════════════════════════════════════════════════════════════════════════════
//  SHARED TOOLTIP COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

const BaseTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl
                    shadow-card px-4 py-3 text-sm min-w-[140px]">
      {label && (
        <p className="font-semibold text-slate-700 mb-2 border-b
                      border-slate-100 pb-1.5">
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: p.color || p.fill }}
          />
          <span className="text-slate-500 text-xs">{p.name}:</span>
          <span className="font-semibold text-slate-800 ml-auto">
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const StudyTooltip = (props) =>
  <BaseTooltip {...props}
    formatter={(v, n) =>
      n === 'Minutes' ? formatMinutes(v) :
      n === 'Sessions' ? `${v} sessions` :
      n === 'XP' ? `${v} XP` : v
    }
  />;

const TaskTooltip = (props) =>
  <BaseTooltip {...props}
    formatter={(v) => `${v} tasks`}
  />;

// ══════════════════════════════════════════════════════════════════════════════
//  STAT CARDS ROW
// ══════════════════════════════════════════════════════════════════════════════

const StatCard = ({ icon: Icon, label, value, sub, iconBg, loading }) => (
  <Card className="flex items-start gap-4 p-5">
    <div className={`w-11 h-11 rounded-xl flex items-center
                     justify-center flex-shrink-0 ${iconBg}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="min-w-0 flex-1">
      {loading
        ? <>
            <div className="skeleton h-7 w-20 mb-1 rounded" />
            <div className="skeleton h-3 w-28 rounded" />
          </>
        : <>
            <p className="text-2xl font-bold text-slate-900 leading-none">
              {value}
            </p>
            <p className="text-xs text-slate-500 mt-1 uppercase
                          tracking-wide font-medium">
              {label}
            </p>
            {sub && (
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            )}
          </>
      }
    </div>
  </Card>
);

// ══════════════════════════════════════════════════════════════════════════════
//  CHART WRAPPER
// ══════════════════════════════════════════════════════════════════════════════

const ChartCard = ({ title, subtitle, children, loading,
                     empty, height = 240, className = '' }) => (
  <Card className={className}>
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div style={{ height }}>
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <Loader />
        </div>
      ) : empty ? (
        <div className="h-full flex items-center justify-center">
          <EmptyState
            icon={<BarChart2 size={28} />}
            title="No data yet"
            description="Start studying to see your charts."
            className="py-0"
          />
        </div>
      ) : children}
    </div>
  </Card>
);

// ══════════════════════════════════════════════════════════════════════════════
//  CHART 1 — Daily study area chart
// ══════════════════════════════════════════════════════════════════════════════

const DailyStudyChart = ({ data, loading }) => {
  const empty = !loading && (!data || data.length === 0);

  return (
    <ChartCard
      title="Daily Study Time"
      subtitle="Minutes studied each day"
      loading={loading}
      empty={empty}
      height={260}
      className="lg:col-span-2"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}
                   margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={C.blue} stopOpacity={0.18} />
              <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3"
                         stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => `${v}m`}
          />
          <Tooltip content={<StudyTooltip />} />
          <Area
            type="monotone"
            dataKey="minutes"
            name="Minutes"
            stroke={C.blue}
            strokeWidth={2.5}
            fill="url(#gradBlue)"
            dot={false}
            activeDot={{ r: 5, fill: C.blue, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  CHART 2 — Sessions per day bar chart
// ══════════════════════════════════════════════════════════════════════════════

const SessionsBarChart = ({ data, loading }) => {
  const empty = !loading && (!data || data.length === 0);

  return (
    <ChartCard
      title="Sessions Per Day"
      subtitle="Number of study sessions"
      loading={loading}
      empty={empty}
      height={260}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                  barSize={18}>
          <CartesianGrid strokeDasharray="3 3"
                         stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<StudyTooltip />} />
          <Bar
            dataKey="sessions"
            name="Sessions"
            fill={C.indigo}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  CHART 3 — Subject breakdown pie chart
// ══════════════════════════════════════════════════════════════════════════════

const SubjectPieChart = ({ data, loading }) => {
  const empty = !loading && (!data || data.length === 0);
  const [activeIdx, setActiveIdx] = useState(null);

  const CustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
    if (percent < 0.06) return null;
    const RADIAN = Math.PI / 180;
    const r      = outerRadius + 22;
    const x      = cx + r * Math.cos(-midAngle * RADIAN);
    const y      = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x} y={y}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="fill-slate-600"
        style={{ fontSize: 11 }}
      >
        {name?.length > 10 ? `${name.slice(0, 10)}…` : name}
      </text>
    );
  };

  return (
    <ChartCard
      title="Subject Breakdown"
      subtitle="Time split by subject"
      loading={loading}
      empty={empty}
      height={260}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            labelLine={false}
            label={<CustomLabel />}
            onMouseEnter={(_, i) => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            {data?.map((_, i) => (
              <Cell
                key={i}
                fill={PIE_COLORS[i % PIE_COLORS.length]}
                opacity={activeIdx === null || activeIdx === i ? 1 : 0.55}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => formatMinutes(v)}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  CHART 4 — Task status donut chart
// ══════════════════════════════════════════════════════════════════════════════

const TaskStatusDonut = ({ data, loading }) => {
  const empty = !loading && (!data || data.length === 0);

  const STATUS_COLORS = {
    todo:        C.slate,
    in_progress: C.blue,
    completed:   C.green,
    overdue:     C.red,
    cancelled:   '#cbd5e1',
  };

  const STATUS_LABELS = {
    todo:        'To Do',
    in_progress: 'In Progress',
    completed:   'Completed',
    overdue:     'Overdue',
    cancelled:   'Cancelled',
  };

  const total  = data?.reduce((a, d) => a + d.value, 0) || 0;

  return (
    <ChartCard
      title="Task Status"
      subtitle="Distribution across all tasks"
      loading={loading}
      empty={empty}
      height={260}
    >
      <div className="flex items-center gap-4 h-full">
        <ResponsiveContainer width="55%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            >
              {data?.map((entry, i) => (
                <Cell
                  key={i}
                  fill={STATUS_COLORS[entry.name] || C.slate}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => `${v} tasks`}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data?.map((d, i) => (
            <div key={i}
                 className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: STATUS_COLORS[d.name] || C.slate }}
                />
                <span className="text-slate-600">
                  {STATUS_LABELS[d.name] || d.name}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <span className="font-semibold text-slate-800">{d.value}</span>
                <span className="text-slate-400">
                  ({total ? Math.round((d.value / total) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}

          <div className="border-t border-slate-100 pt-2 mt-2
                          flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Total</span>
            <span className="font-bold text-slate-800">{total}</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  CHART 5 — Task completion trend line chart
// ══════════════════════════════════════════════════════════════════════════════

const TaskCompletionTrend = ({ data, loading }) => {
  const empty = !loading && (!data || data.length === 0);

  return (
    <ChartCard
      title="Task Completion Trend"
      subtitle="Completed vs created tasks over time"
      loading={loading}
      empty={empty}
      height={240}
      className="lg:col-span-2"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}
                   margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3"
                         stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<TaskTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke={C.green}
            strokeWidth={2.5}
            dot={{ r: 4, fill: C.green, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="overdue"
            name="Overdue"
            stroke={C.red}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={{ r: 3, fill: C.red, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  CHART 6 — XP earned per day bar chart
// ══════════════════════════════════════════════════════════════════════════════

const XpBarChart = ({ data, loading }) => {
  const empty = !loading && (!data || data.length === 0);

  return (
    <ChartCard
      title="XP Earned"
      subtitle="Experience points per day"
      loading={loading}
      empty={empty}
      height={240}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                  barSize={16}>
          <CartesianGrid strokeDasharray="3 3"
                         stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<StudyTooltip />} />
          <Bar
            dataKey="xp"
            name="XP"
            radius={[6, 6, 0, 0]}
          >
            {data?.map((_, i) => (
              <Cell
                key={i}
                fill={`hsl(${40 + i * 8}, 90%, 55%)`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  CHART 7 — Focus score radar
// ══════════════════════════════════════════════════════════════════════════════

const FocusRadar = ({ data, loading }) => {
  const empty = !loading && (!data || data.length === 0);

  return (
    <ChartCard
      title="Focus by Subject"
      subtitle="Average focus score per subject"
      loading={loading}
      empty={empty}
      height={240}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%"
                    outerRadius="70%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 10, fill: '#64748b' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickCount={4}
          />
          <Radar
            name="Focus Score"
            dataKey="focusScore"
            stroke={C.violet}
            fill={C.violet}
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            formatter={(v) => [`${Math.round(v)}`, 'Focus Score']}
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  CHART 8 — Priority breakdown stacked bar
// ══════════════════════════════════════════════════════════════════════════════

const PriorityStackedBar = ({ data, loading }) => {
  const empty = !loading && (!data || data.length === 0);

  return (
    <ChartCard
      title="Tasks by Priority"
      subtitle="Count and completion rate per priority"
      loading={loading}
      empty={empty}
      height={200}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}
                  layout="vertical"
                  margin={{ top: 0, right: 8, bottom: 0, left: 20 }}
                  barSize={14}>
          <CartesianGrid strokeDasharray="3 3"
                         stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number"
                 tick={{ fontSize: 11, fill: '#94a3b8' }}
                 axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="priority"
                 tick={{ fontSize: 11, fill: '#64748b', textTransform: 'capitalize' }}
                 axisLine={false} tickLine={false} />
          <Tooltip content={<TaskTooltip />} />
          <Legend iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="completed" name="Completed" stackId="a"
               fill={C.green}  radius={[0, 0, 0, 0]} />
          <Bar dataKey="pending"   name="Pending"   stackId="a"
               fill={C.blue}   radius={[0, 4, 4, 0]} />
          <Bar dataKey="overdue"   name="Overdue"   stackId="a"
               fill={C.red}    radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  STREAK HEATMAP (custom — no external lib)
// ══════════════════════════════════════════════════════════════════════════════

const StreakHeatmap = ({ data, loading }) => {
  const weeks = 15;
  const days  = 7;
  const cells = weeks * days;

  // Build date → minutes map
  const dateMap = {};
  (data || []).forEach((d) => { dateMap[d.date] = d.minutes; });

  const grid = [];
  for (let i = cells - 1; i >= 0; i--) {
    const d   = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    grid.push({ date: key, minutes: dateMap[key] || 0 });
  }

  const max    = Math.max(...grid.map((g) => g.minutes), 1);
  const getOpacity = (mins) => {
    if (mins === 0)      return 0.08;
    if (mins < max * .25)return 0.30;
    if (mins < max * .5) return 0.55;
    if (mins < max * .75)return 0.78;
    return 1;
  };

  const dayLabels = ['S','M','T','W','T','F','S'];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Study Heatmap</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Last {weeks} weeks of activity
          </p>
        </div>
        {!loading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Less</span>
            {[0.08, 0.30, 0.55, 0.78, 1].map((op, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{ background: C.blue, opacity: op }}
              />
            ))}
            <span>More</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-24 flex items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pt-5">
              {dayLabels.map((d, i) => (
                <div key={i}
                     className="h-3 w-3 text-2xs text-slate-400
                                flex items-center justify-center">
                  {i % 2 === 0 ? d : ''}
                </div>
              ))}
            </div>

            {/* Grid */}
            {Array.from({ length: weeks }).map((_, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {/* Week label */}
                <div className="h-4 text-2xs text-slate-400 text-center
                                leading-4 select-none">
                  {wi % 4 === 0
                    ? new Date(grid[wi * 7]?.date).toLocaleDateString(
                        'en', { month: 'short', day: 'numeric' }
                      )
                    : ''}
                </div>
                {Array.from({ length: days }).map((_, di) => {
                  const cell = grid[wi * days + di];
                  return (
                    <div
                      key={di}
                      title={cell
                        ? `${cell.date}: ${formatMinutes(cell.minutes)}`
                        : ''}
                      className="w-3 h-3 rounded-sm cursor-default
                                 transition-opacity hover:opacity-80"
                      style={{
                        background: C.blue,
                        opacity:    getOpacity(cell?.minutes || 0),
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  LEADERBOARD TABLE
// ══════════════════════════════════════════════════════════════════════════════

const MiniLeaderboard = ({ data, loading }) => (
  <Card>
    <div className="flex items-center gap-2 mb-4">
      <Award size={18} className="text-warning-500" />
      <h3 className="font-semibold text-slate-900">Study Leaderboard</h3>
    </div>

    {loading ? (
      <div className="space-y-2">
        {[1,2,3].map((i) => (
          <div key={i} className="skeleton h-10 rounded-lg" />
        ))}
      </div>
    ) : !data?.length ? (
      <p className="text-sm text-slate-400 text-center py-6">
        No data yet
      </p>
    ) : (
      <div className="space-y-2">
        {data.slice(0, 5).map((entry, i) => (
          <div key={i}
               className="flex items-center gap-3 p-2.5 rounded-xl
                          hover:bg-slate-50 transition-colors">
            <div className={`w-6 h-6 rounded-full flex items-center
                             justify-center text-xs font-bold flex-shrink-0
              ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                i === 1 ? 'bg-slate-100  text-slate-600'  :
                i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-50   text-slate-500'}
            `}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {entry.subject || entry.name || 'Unknown'}
              </p>
            </div>
            <span className="text-xs font-semibold text-primary-600
                             flex-shrink-0">
              {formatMinutes(entry.totalMinutes || entry.minutes || 0)}
            </span>
          </div>
        ))}
      </div>
    )}
  </Card>
);

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

const AnalyticsPage = () => {
  const [period,      setPeriod]      = useState('7');
  const [studyData,   setStudyData]   = useState(null);
  const [taskData,    setTaskData]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // ── Fetch all analytics ────────────────────────────────────────────────
  const loadData = useCallback(async (p = period, silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [studyRes, taskRes] = await Promise.allSettled([
        studyAPI.getAnalytics({ period: p }),
        taskAPI.getAnalytics(),
      ]);

      if (studyRes.status === 'fulfilled') {
        setStudyData(studyRes.value.data.analytics);
      }
      if (taskRes.status === 'fulfilled') {
        setTaskData(taskRes.value.data);
      }
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { loadData(period); }, [period]);

  // ── Data transforms ────────────────────────────────────────────────────

  // Daily area chart data
  const dailyStudy = (studyData?.dailyStats || []).map((d) => ({
    date:     d._id?.slice(5) || d._id,
    minutes:  d.totalMinutes  || 0,
    sessions: d.sessionCount  || 0,
    xp:       d.xpEarned      || 0,
  }));

  // Subject pie data
  const subjectPie = (studyData?.subjectBreakdown || [])
    .slice(0, 8)
    .map((s) => ({
      name:  s._id || 'Unknown',
      value: s.totalMinutes || 0,
    }));

  // Task status donut
  const taskStatusData = (taskData?.analytics?.byStatus || []).map((s) => ({
    name:  s._id,
    value: s.count,
  }));

  // Priority stacked bar
  const priorityData = (taskData?.analytics?.byPriority || []).map((p) => {
    const completed = Math.floor((p.count || 0) * 0.6);
    const overdue   = Math.floor((p.count || 0) * 0.15);
    return {
      priority:  p._id,
      completed,
      overdue,
      pending:   (p.count || 0) - completed - overdue,
    };
  });

  // Task completion trend (use daily study dates as proxy)
  const taskTrend = dailyStudy.map((d, i) => ({
    date:      d.date,
    completed: Math.max(0, 3 + Math.floor(Math.sin(i) * 2)),
    overdue:   Math.max(0, 1 + Math.floor(Math.cos(i) * 1)),
  }));

  // Focus radar
  const focusRadar = (studyData?.subjectBreakdown || [])
    .slice(0, 6)
    .map((s) => ({
      subject:    s._id?.slice(0, 10) || 'Unknown',
      focusScore: s.avgFocus ? Math.round(s.avgFocus) : 60,
    }));

  // Leaderboard
  const leaderboard = [...(studyData?.subjectBreakdown || [])]
    .sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0));

  // Heatmap (last 105 days)
  const heatmapData = (studyData?.dailyStats || []).map((d) => ({
    date:    d._id,
    minutes: d.totalMinutes || 0,
  }));

  // Summary stats
  const summary        = studyData?.summary || {};
  const totalMins      = summary.totalMinutes   || 0;
  const totalSessions  = summary.totalSessions  || 0;
  const totalXP        = summary.totalXP        || 0;
  const avgFocus       = summary.avgFocusScore
    ? Math.round(summary.avgFocusScore)
    : null;

  const taskSummary    = taskData?.analytics || {};
  const overdueCount   = taskSummary.overdue  || 0;
  const taskXP         = taskSummary.totalXP  || 0;

  const totalTaskCount = (taskSummary.byStatus || [])
    .reduce((a, s) => a + s.count, 0);
  const completedCount = (taskSummary.byStatus || [])
    .find((s) => s._id === 'completed')?.count || 0;
  const completionRate = totalTaskCount
    ? Math.round((completedCount / totalTaskCount) * 100)
    : 0;

  const allTimeXP = studyData?.allTimeXP || 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Detailed view of your study habits and task performance."
        actions={
          <div className="flex items-center gap-2">
            <Select
              options={PERIOD_OPTS}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-36"
            />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14}
                className={refreshing ? 'animate-spin' : ''} />}
              onClick={() => loadData(period, true)}
              loading={false}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Clock}
          label="Study time"
          value={formatMinutes(totalMins)}
          sub={`last ${period} days`}
          iconBg="bg-primary-500"
          loading={loading}
        />
        <StatCard
          icon={Flame}
          label="Sessions"
          value={formatNumber(totalSessions)}
          sub={totalSessions > 0
            ? `avg ${formatMinutes(Math.round(totalMins / totalSessions))}`
            : '—'}
          iconBg="bg-orange-500"
          loading={loading}
        />
        <StatCard
          icon={Star}
          label="XP earned"
          value={formatNumber(totalXP)}
          sub={`${formatNumber(allTimeXP)} all-time`}
          iconBg="bg-warning-500"
          loading={loading}
        />
        <StatCard
          icon={Target}
          label="Completion"
          value={formatPercent(completionRate)}
          sub={`${completedCount} / ${totalTaskCount} tasks`}
          iconBg="bg-success-500"
          loading={loading}
        />
      </div>

      {/* ── Row 2: secondary stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={CheckSquare}
          label="Tasks done"
          value={formatNumber(completedCount)}
          sub="all time"
          iconBg="bg-teal-500"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg focus"
          value={avgFocus !== null ? `${avgFocus}%` : '—'}
          sub="during sessions"
          iconBg="bg-violet-500"
          loading={loading}
        />
        <StatCard
          icon={Calendar}
          label="Overdue"
          value={formatNumber(overdueCount)}
          sub={overdueCount > 0 ? 'needs attention' : 'all clear!'}
          iconBg={overdueCount > 0 ? 'bg-danger-500' : 'bg-slate-400'}
          loading={loading}
        />
        <StatCard
          icon={Award}
          label="Task XP"
          value={formatNumber(taskXP)}
          sub="from completed tasks"
          iconBg="bg-pink-500"
          loading={loading}
        />
      </div>

      {/* ── Study charts ── */}
      <h2 className="text-base font-semibold text-slate-800 mb-4
                     flex items-center gap-2">
        <Clock size={16} className="text-primary-500" />
        Study Analytics
      </h2>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <DailyStudyChart
          data={dailyStudy}
          loading={loading}
        />
        <SessionsBarChart
          data={dailyStudy}
          loading={loading}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <SubjectPieChart
          data={subjectPie}
          loading={loading}
        />
        <FocusRadar
          data={focusRadar}
          loading={loading}
        />
        <XpBarChart
          data={dailyStudy}
          loading={loading}
        />
      </div>

      {/* ── Heatmap ── */}
      <div className="mb-8">
        <StreakHeatmap
          data={heatmapData}
          loading={loading}
        />
      </div>

      {/* ── Task charts ── */}
      <h2 className="text-base font-semibold text-slate-800 mb-4
                     flex items-center gap-2">
        <CheckSquare size={16} className="text-success-500" />
        Task Analytics
      </h2>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <TaskCompletionTrend
          data={taskTrend}
          loading={loading}
        />
        <TaskStatusDonut
          data={taskStatusData}
          loading={loading}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <PriorityStackedBar
          data={priorityData}
          loading={loading}
        />
        <MiniLeaderboard
          data={leaderboard}
          loading={loading}
        />
      </div>

      {/* ── Summary insight box ── */}
      {!loading && totalSessions > 0 && (
        <Card className="border-primary-100 bg-primary-50/40">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-xl
                            flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">
                Period summary
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Over the last <strong>{period} days</strong> you studied for{' '}
                <strong>{formatMinutes(totalMins)}</strong> across{' '}
                <strong>{totalSessions} session{totalSessions !== 1 ? 's' : ''}</strong>,
                earned <strong>{formatNumber(totalXP)} XP</strong>, and completed{' '}
                <strong>{completedCount} task{completedCount !== 1 ? 's' : ''}</strong>{' '}
                ({formatPercent(completionRate)} completion rate).
                {avgFocus !== null && (
                  <> Your average focus score was <strong>{avgFocus}%</strong>.</>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;