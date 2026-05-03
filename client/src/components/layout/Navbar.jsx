import { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import NotificationDropdown from '../notifications/NotificationDropdown';
import useAuth from '../../hooks/useAuth';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const unreadCount = useSelector((s) => s.notifications.unreadCount);
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="h-16 flex items-center px-4 gap-3 sticky top-0 z-20 lg:pl-72
                       bg-[#E9EFEC]/70 backdrop-blur-2xl border-b border-white/40
                       shadow-[0_4px_20px_rgba(0,0,0,0.04)]">

      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2.5 rounded-2xl text-[#1A1A1A]
                   hover:bg-white/50 hover:text-[#16423C]
                   hover:shadow-sm hover:-translate-y-[1px]
                   transition-all duration-200"
      >
        <Menu size={20} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notification bell */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs((v) => !v)}
          className="relative p-2.5 rounded-2xl text-[#1A1A1A]
                     hover:bg-white/50 hover:text-[#16423C]
                     hover:shadow-sm hover:-translate-y-[1px]
                     transition-all duration-200"
        >
          <Bell
            size={20}
            className="transition-transform duration-200 hover:scale-110"
          />

          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5
                             rounded-full bg-[#16423C]
                             border-2 border-[#E9EFEC] shadow" />
          )}
        </button>

        {showNotifs && (
          <div className="absolute right-0 mt-2">
            <NotificationDropdown onClose={() => setShowNotifs(false)} />
          </div>
        )}
      </div>

      {/* Avatar */}
      <Link
        to="/settings"
        className="ml-1 p-[2px] rounded-2xl
                   hover:bg-white/50 hover:shadow-sm
                   transition-all duration-200"
      >
        <div className="rounded-xl overflow-hidden">
          <Avatar user={user} size="sm" />
        </div>
      </Link>
    </header>
  );
};

export default Navbar;