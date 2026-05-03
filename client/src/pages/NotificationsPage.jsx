import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector }         from 'react-redux';
import { Link }                             from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2,
  Filter, RefreshCw,
}                                           from 'lucide-react';
import toast                                from 'react-hot-toast';
import {
  markAllRead, markAsRead as markReadLocal,
  removeNotification,
}                                           from '../features/notifications/notificationSlice';
import { notificationAPI }                  from '../services/api';
import PageHeader                           from '../components/common/PageHeader';
import Card                                 from '../components/common/Card';
import Button                               from '../components/common/Button';
import Badge                                from '../components/common/Badge';
import Loader                               from '../components/common/Loader';
import EmptyState                           from '../components/common/EmptyState';
import { formatRelative }                   from '../utils/formatters';

const TYPE_META = {
  task_assigned:        { icon: '📋', color: 'bg-primary-50 border-primary-100' },
  task_overdue:         { icon: '⏰', color: 'bg-danger-50  border-danger-100'  },
  task_upcoming:        { icon: '🔔', color: 'bg-warning-50 border-warning-100' },
  assignment_created:   { icon: '📝', color: 'bg-primary-50 border-primary-100' },
  assignment_graded:    { icon: '🎓', color: 'bg-success-50 border-success-100' },
  assignment_submitted: { icon: '📤', color: 'bg-slate-50   border-slate-100'   },
  room_announcement:    { icon: '📣', color: 'bg-warning-50 border-warning-100' },
  parent_link_request:  { icon: '🔗', color: 'bg-primary-50 border-primary-100' },
  xp_earned:            { icon: '⭐', color: 'bg-warning-50 border-warning-100' },
  level_up:             { icon: '🎉', color: 'bg-success-50 border-success-100' },
  study_streak:         { icon: '🔥', color: 'bg-warning-50 border-warning-100' },
  monthly_report:       { icon: '📊', color: 'bg-slate-50   border-slate-100'   },
  system:               { icon: '🔧', color: 'bg-slate-50   border-slate-100'   },
};

const PRIORITY_BADGE = {
  urgent: 'red',
  high:   'yellow',
  medium: 'blue',
  low:    'slate',
};

// ── Single notification card ──────────────────────────────────────────────────
const NotifCard = ({ notif, onRead, onDelete }) => {
  const meta  = TYPE_META[notif.type] || TYPE_META.system;

  return (
    <div
      className={`
        flex items-start gap-4 p-4 rounded-xl border transition-all
        ${!notif.isRead
          ? 'bg-primary-50/60 border-primary-100'
          : 'bg-white border-slate-200 hover:border-slate-300'}
      `}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                       flex-shrink-0 text-lg border ${meta.color}`}>
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold
            ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
            {notif.title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant={PRIORITY_BADGE[notif.priority]}>
              {notif.priority}
            </Badge>
            {!notif.isRead && (
              <div className="w-2 h-2 rounded-full bg-primary-500" />
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {notif.message}
        </p>

        <div className="flex items-center gap-3 mt-2">
          <span className="text-2xs text-slate-400">
            {formatRelative(notif.createdAt)}
          </span>

          {notif.link && (
            <Link
              to={notif.link}
              className="text-2xs text-primary-600 hover:text-primary-700
                         font-medium"
              onClick={() => !notif.isRead && onRead(notif._id || notif.id)}
            >
              View →
            </Link>
          )}

          {!notif.isRead && (
            <button
              onClick={() => onRead(notif._id || notif.id)}
              className="text-2xs text-slate-400 hover:text-slate-600
                         transition-colors"
            >
              Mark read
            </button>
          )}

          <button
            onClick={() => onDelete(notif._id || notif.id)}
            className="text-2xs text-slate-300 hover:text-danger-500
                       transition-colors ml-auto"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  NotificationsPage
// ═════════════════════════════════════════════════════════════════════════════
const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { items: localItems, unreadCount } = useSelector((s) => s.notifications);

  const [serverItems, setServerItems]   = useState([]);
  const [loading,     setLoading]       = useState(true);
  const [filter,      setFilter]        = useState('all'); // all | unread
  const [page,        setPage]          = useState(1);
  const [totalPages,  setTotalPages]    = useState(1);
  const [stats,       setStats]         = useState(null);

  // ── Load from server ───────────────────────────────────────────────────
  const loadNotifications = useCallback(async (p = 1, f = filter) => {
    try {
      setLoading(true);
      const params = { page: p, limit: 15 };
      if (f === 'unread') params.isRead = false;

      const [notifRes, statsRes] = await Promise.allSettled([
        notificationAPI.getAll(params),
        notificationAPI.getStats(),
      ]);

      if (notifRes.status === 'fulfilled') {
        setServerItems(notifRes.value.data.notifications || []);
        setTotalPages(notifRes.value.data.pagination?.pages || 1);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.stats);
      }
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications(1, filter);
    setPage(1);
  }, [filter]);

  // ── Merge local (socket) + server items, deduplicate ──────────────────
  const merged = (() => {
    const serverIds = new Set(serverItems.map((n) => n._id));
    const localOnly = localItems.filter((n) => !serverIds.has(n._id));
    return [...localOnly, ...serverItems];
  })();

  const displayed = filter === 'unread'
    ? merged.filter((n) => !n.isRead)
    : merged;

  // ── Mark single as read ────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      dispatch(markReadLocal(id));
      setServerItems((prev) =>
        prev.map((n) =>
          (n._id === id || n.id === id)
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        )
      );
    } catch { toast.error('Failed to mark as read'); }
  };

  // ── Mark all read ──────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      dispatch(markAllRead());
      setServerItems((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      dispatch(removeNotification(id));
      setServerItems((prev) =>
        prev.filter((n) => n._id !== id && n.id !== id)
      );
    } catch { toast.error('Failed to delete notification'); }
  };

  // ── Delete all read ────────────────────────────────────────────────────
  const handleDeleteAllRead = async () => {
    try {
      await notificationAPI.deleteAllRead();
      setServerItems((prev) => prev.filter((n) => !n.isRead));
      toast.success('Cleared all read notifications');
    } catch { toast.error('Failed to clear notifications'); }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => loadNotifications(page, filter)}
              loading={loading}
            >
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<CheckCheck size={14} />}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </Button>
            )}
          </div>
        }
      />

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total',  value: stats.total  },
            { label: 'Unread', value: stats.unread, highlight: true },
            { label: 'Today',  value: stats.byType?.[0]?.count || 0 },
            { label: 'Types',  value: stats.byType?.length || 0 },
          ].map((s) => (
            <Card key={s.label} className="p-4 text-center">
              <p className={`text-2xl font-bold
                ${s.highlight && s.value > 0
                  ? 'text-primary-600'
                  : 'text-slate-900'}`}>
                {s.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <Card className="mb-4 p-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            {['all', 'unread'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium
                            transition-colors capitalize
                  ${filter === f
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={handleDeleteAllRead}
            className="text-xs text-slate-400 hover:text-danger-600
                       transition-colors flex items-center gap-1"
          >
            <Trash2 size={13} />
            Clear read
          </button>
        </div>
      </Card>

      {/* List */}
      {loading && page === 1 ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" />
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={<Bell size={32} />}
          title={filter === 'unread'
            ? 'No unread notifications'
            : 'No notifications yet'}
          description={filter === 'unread'
            ? 'You\'re all caught up!'
            : 'Notifications will appear here as you use StudySync.'}
        />
      ) : (
        <>
          <div className="space-y-2">
            {displayed.map((n) => (
              <NotifCard
                key={n._id || n.id}
                notif={n}
                onRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  loadNotifications(p, filter);
                }}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  loadNotifications(p, filter);
                }}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsPage;