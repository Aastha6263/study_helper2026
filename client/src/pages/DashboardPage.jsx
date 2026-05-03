import { useEffect, useState } from 'react';
import MiniStudyChart from '../components/charts/MiniStudyChart';
import { Link } from 'react-router-dom';
import {
  Clock, CheckSquare, Flame, Star,
  TrendingUp, ArrowRight, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studyAPI, taskAPI } from '../services/api';
import useAuth from '../hooks/useAuth';
import PageHeader from '../components/common/PageHeader';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatMinutes, formatDueDate } from '../utils/formatters';

/* 💎 Glass Card */
const GlassCard = ({ children }) => (
  <div className="
    bg-white/60 backdrop-blur-xl
    border border-white/40
    rounded-2xl p-5
    shadow-[0_8px_30px_rgba(0,0,0,0.05)]
    hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]
    hover:-translate-y-[2px]
    transition-all duration-300
  ">
    {children}
  </div>
);

/* 🔥 Stat Card */
const StatCard = ({ icon: Icon, label, value, color, link }) => (
  <Link to={link || "#"}>
    <GlassCard>
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} shadow`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-[#1A1A1A]">{value}</p>
          <p className="text-xs text-[#1A1A1A]/60">{label}</p>
        </div>
      </div>
    </GlassCard>
  </Link>
);

const DashboardPage = () => {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingMain, setLoadingMain] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res1 = await studyAPI.getAnalytics({ period: 7 });
        const res2 = await taskAPI.getAll();

        setAnalytics(res1.data.analytics);
        setTasks(res2.data.tasks);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoadingMain(false);
      }
    };
    load();
  }, []);

  const chartData =
    analytics?.dailyStats?.map((d) => ({
      date: d._id?.slice(5),
      minutes: d.totalMinutes,
    })) || [];

  /* 🔥 NEW: Overdue Count (SAFE FEATURE) */
  const overdueCount = tasks.filter(
    (t) => new Date(t.dueDate) < new Date() && !t.completed
  ).length;

  return (
    <div className="relative min-h-screen p-6 overflow-hidden bg-[#E9EFEC]">

      {/* Background Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute w-[500px] h-[500px] bg-[#6A9C89]/20 blur-3xl rounded-full top-[-100px] left-[-100px]" />
        <div className="absolute w-[400px] h-[400px] bg-[#16423C]/10 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />
      </div>

      <div className="relative z-10">

        {/* Header */}
        <PageHeader
          title={`Welcome back, ${user?.name || 'Student'} 👋`}
          subtitle="Stay consistent and win your goals 🚀"
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Clock}
            label="Study Time"
            value={formatMinutes(analytics?.summary?.totalMinutes || 0)}
            color="bg-gradient-to-br from-[#16423C] to-[#6A9C89]"
            link="/analytics"
          />

          <StatCard
            icon={CheckSquare}
            label="Tasks"
            value={tasks.length}
            color="bg-gradient-to-br from-green-400 to-green-600"
            link="/tasks"
          />

          <StatCard
            icon={Star}
            label="XP"
            value={analytics?.summary?.totalXP || 0}
            color="bg-gradient-to-br from-yellow-400 to-orange-500"
          />

          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={overdueCount}
            color="bg-gradient-to-br from-red-400 to-red-600"
            link="/tasks"
          />
        </div>

        {/* Chart */}
        <GlassCard>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#1A1A1A] tracking-tight">
              Study Activity
            </h3>

            <Link
              to="/analytics"
              className="text-[#16423C] text-sm font-medium hover:text-[#6A9C89]"
            >
              View →
            </Link>
          </div>

          {loadingMain ? (
            <div className="h-48 flex items-center justify-center">
              <Loader />
            </div>
          ) : chartData.length === 0 ? (
            <EmptyState title="No data yet" />
          ) : (
            <MiniStudyChart data={chartData} height={200} showAxes />
          )}
        </GlassCard>

        {/* Tasks */}
        <div className="mt-6">
          <GlassCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[#1A1A1A]">Tasks</h3>

              <Link
                to="/tasks"
                className="text-xs text-[#16423C] hover:text-[#6A9C89]"
              >
                View all →
              </Link>
            </div>

            {tasks.length === 0 ? (
              <EmptyState title="No tasks" />
            ) : (
              tasks.slice(0, 5).map((t) => (
                <div
                  key={t._id}
                  className="flex justify-between items-center py-2 px-3
                             rounded-xl hover:bg-white/50 transition"
                >
                  <p className="text-sm text-[#1A1A1A] truncate">
                    {t.title}
                  </p>

                  <span className="text-xs text-[#6A9C89]">
                    {formatDueDate(t.dueDate)?.label}
                  </span>
                </div>
              ))
            )}
          </GlassCard>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">

          <GlassCard>
            <div className="flex items-center gap-2 text-[#1A1A1A]">
              <Flame />
              <h3>Study Streak</h3>
            </div>
            <p className="text-3xl font-bold mt-2 text-orange-500">5 Days 🔥</p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 text-[#1A1A1A]">
              <TrendingUp />
              <h3>Focus Score</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 mt-2">82%</p>
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold mb-3 text-[#1A1A1A]">
              Quick Actions
            </h3>

            <div className="flex flex-col gap-2 text-sm">
              <Link
                to="/study-session"
                className="flex justify-between items-center p-2 rounded-xl
                           hover:bg-white/50 transition"
              >
                Start Study <ArrowRight size={14} />
              </Link>

              <Link
                to="/tasks"
                className="flex justify-between items-center p-2 rounded-xl
                           hover:bg-white/50 transition"
              >
                Add Task <ArrowRight size={14} />
              </Link>

              <Link
                to="/ai"
                className="flex justify-between items-center p-2 rounded-xl
                           hover:bg-white/50 transition"
              >
                Ask AI <ArrowRight size={14} />
              </Link>
            </div>
          </GlassCard>

        </div>

      </div>
    </div>
  );
};

export default DashboardPage;