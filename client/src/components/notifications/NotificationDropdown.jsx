import { useRef, useEffect }      from 'react';
import { useDispatch, useSelector }from 'react-redux';
import { Link }                   from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { markAllAsRead }          from '../../features/notifications/notificationSlice';
import { notificationAPI }        from '../../services/api';
import useOutsideClick            from '../../hooks/useOutsideClick';
import { formatRelative }         from '../../utils/formatters';
import Loader                     from '../common/Loader';

const TYPE_ICONS = {
  task_assigned:      '📋',
  task_overdue:       '⏰',
  task_upcoming:      '🔔',
  assignment_created: '📝',
  assignment_graded:  '🎓',
  room_announcement:  '📣',
  xp_earned:          '⭐',
  level_up:           '🎉',
  study_streak:       '🔥',
  monthly_report:     '📊',
  system:             '🔧',
};

const NotificationDropdown = ({ onClose }) => {
  const dispatch    = useDispatch();
  const ref         = useRef(null);
  const { items, unreadCount } = useSelector((s) => s.notifications);

  useOutsideClick(ref, onClose);

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    dispatch(markAllAsRead());
  };

  const preview = items.slice(0, 6);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 w-96
                 bg-white/70 backdrop-blur-2xl
                 rounded-2xl border border-white/40
                 shadow-[0_10px_40px_rgba(0,0,0,0.08)]
                 z-50 animate-slide-down
                 flex flex-col max-h-[480px] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-white/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-[#1A1A1A] text-sm tracking-tight">
            Notifications
          </h4>
          {unreadCount > 0 && (
            <span className="px-2 py-[2px] rounded-full text-[10px] font-semibold
                             bg-[#16423C] text-white">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs font-medium
                       text-[#6A9C89] hover:text-[#16423C]
                       transition-colors"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/30">
        {preview.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <Bell size={32} className="text-[#6A9C89]/40 mb-2" />
            <p className="text-sm text-[#6A9C89]">No notifications yet</p>
          </div>
        ) : (
          preview.map((n) => (
            <div
              key={n.id || n._id}
              className={`flex items-start gap-3 px-4 py-3
                          transition-all duration-200
                          hover:bg-white/50 hover:backdrop-blur-md
                          ${!n.isRead ? 'bg-[#6A9C89]/10' : ''}`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">
                {TYPE_ICONS[n.type] || '🔔'}
              </span>

              <div className="flex-1 min-w-0">
                <p className={`text-sm ${
                  !n.isRead
                    ? 'font-semibold text-[#1A1A1A]'
                    : 'text-[#1A1A1A]/80'
                }`}>
                  {n.title}
                </p>

                <p className="text-xs text-[#1A1A1A]/60 mt-0.5 leading-relaxed line-clamp-2">
                  {n.message}
                </p>

                <p className="text-[10px] text-[#6A9C89] mt-1">
                  {formatRelative(n.createdAt)}
                </p>
              </div>

              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-[#16423C]
                                flex-shrink-0 mt-1.5 shadow-sm" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/30 flex-shrink-0">
        <Link
          to="/notifications"
          onClick={onClose}
          className="block text-center text-sm font-medium
                     text-[#16423C] hover:text-[#6A9C89]
                     transition-colors"
        >
          View all notifications →
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;