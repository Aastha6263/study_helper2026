import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, FileText, Users,
  BarChart2, Bell, BookOpen, ClipboardList,
  TrendingUp, FileBarChart, LogOut, Settings,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import { SIDEBAR_LINKS } from '../../utils/constants';
import { useSelector } from 'react-redux';
import logo from '../../Pictures/logo.png';

const ICON_MAP = {
  LayoutDashboard, CheckSquare, FileText, Users,
  BarChart2, Bell, BookOpen, ClipboardList,
  TrendingUp, FileBarChart,
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const unreadCount = useSelector((s) => s.notifications.unreadCount);
  const links = SIDEBAR_LINKS[user?.role] || [];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed top-0 left-0 z-30
                     bg-[#E9EFEC]/70 backdrop-blur-2xl border-r border-white/40
                     shadow-[0_10px_40px_rgba(0,0,0,0.06)]">

      {/* TOP (Fixed) */}
      <div className="flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg">
  <img
    src={logo}
    alt="StudySync Logo"
    className="w-full h-full object-cover"
  />
</div>
            <span className="text-[17px] font-semibold text-[#1A1A1A] tracking-tight">
              Study<span className="text-[#16423C]">Sync</span>
            </span>
          </div>
        </div>
      </div>

      {/* SCROLLABLE NAV (ONLY THIS SCROLLS) */}
      <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto
                      scrollbar-thin scrollbar-thumb-[#16423C]/40
                      hover:scrollbar-thumb-[#16423C]/70">

        {links.map((link) => {
          const Icon = ICON_MAP[link.icon];
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[14.5px] font-medium
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-[#16423C] text-white shadow-md shadow-[#16423C]/25'
                    : 'text-[#1A1A1A] hover:bg-white/50 hover:backdrop-blur-md hover:text-[#16423C]'
                }`
              }
            >
              {Icon && (
                <Icon
                  size={18}
                  className="transition-all duration-200 group-hover:scale-110 group-hover:text-[#16423C]"
                />
              )}

              <span className="flex-1 truncate">{link.label}</span>

              {link.icon === 'Bell' && unreadCount > 0 && (
                <span className="min-w-[20px] h-5 px-1 rounded-full text-[10px]
                                 font-bold bg-[#16423C] text-white flex
                                 items-center justify-center shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* BOTTOM (Fixed) */}
      <div className="flex-shrink-0 px-3 py-4 border-t border-white/30 space-y-2">

        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium
                     text-[#1A1A1A] hover:bg-white/50 hover:text-[#16423C] transition-all duration-200"
        >
          <Settings size={18} />
          Settings
        </NavLink>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium
                     text-red-600 hover:bg-red-50/70 hover:backdrop-blur-md
                     hover:text-red-700 transition-all duration-200 w-full text-left"
        >
          <LogOut size={18} />
          Sign out
        </button>

        {/* User Card */}
         <NavLink
          to="/profile">
        <div className="flex items-center gap-3 px-3 py-3 mt-3 rounded-2xl
                        bg-white/55 backdrop-blur-2xl border border-white/40
                        shadow-[0_6px_25px_rgba(0,0,0,0.06)]">
          <Avatar user={user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[14.5px] font-semibold text-[#1A1A1A] truncate">
              {user?.name}
            </p>
            <p className="text-xs text-[#6A9C89] capitalize mt-[2px]">
              {user?.role}
            </p>
          </div>
        </div>
        </NavLink>

      </div>
    </aside>
  );
};

export default Sidebar;