import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  X, LayoutDashboard, CheckSquare, FileText,
  Users, BarChart2, Bell, BookOpen,
  ClipboardList, TrendingUp, FileBarChart, LogOut
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../../components/common/Avatar';
import { SIDEBAR_LINKS } from '../../utils/constants';

const ICON_MAP = {
  LayoutDashboard, CheckSquare, FileText, Users,
  BarChart2, Bell, BookOpen, ClipboardList,
  TrendingUp, FileBarChart,
};

const MobileSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const links = SIDEBAR_LINKS[user?.role] || [];

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col
                        bg-[#E9EFEC]/80 backdrop-blur-2xl border-r border-white/40
                        shadow-[0_10px_40px_rgba(0,0,0,0.08)]">

        {/* Header */}
        <div className="px-5 py-5 border-b border-white/30
                        flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center
                            text-white font-bold text-sm shadow-lg
                            bg-gradient-to-br from-[#16423C] to-[#6A9C89]">
              S
            </div>
            <span className="text-[16px] font-semibold text-[#1A1A1A] tracking-tight">
              Study<span className="text-[#16423C]">Sync</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-[#1A1A1A]
                       hover:bg-white/50 hover:text-[#16423C]
                       hover:shadow-sm hover:-translate-y-[1px]
                       transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = ICON_MAP[link.icon];
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[14.5px] font-medium
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
                    className="transition-transform duration-200 group-hover:scale-110"
                  />
                )}
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/30 space-y-2">

          <button
            onClick={() => { logout(); onClose(); }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium
                       text-red-600 hover:bg-red-50/70 hover:backdrop-blur-md
                       hover:text-red-700 transition-all duration-200 w-full text-left"
          >
            <LogOut size={18} />
            Sign out
          </button>

          {/* User Card */}
          <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-2xl
                          bg-white/60 backdrop-blur-2xl border border-white/40
                          shadow-[0_6px_25px_rgba(0,0,0,0.06)]">
            <Avatar user={user} size="sm" />
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold text-[#1A1A1A] truncate">
                {user?.name}
              </p>
              <p className="text-xs text-[#6A9C89] capitalize mt-[2px]">
                {user?.role}
              </p>
            </div>
          </div>

        </div>
      </aside>
    </div>
  );
};

export default MobileSidebar;