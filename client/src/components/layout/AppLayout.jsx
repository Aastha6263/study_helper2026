import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileSidebar from './MobileSidebar';

const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#E9EFEC] text-[#1A1A1A]">

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar */}
      <MobileSidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-64 relative">

        {/* Subtle background layer (depth feel) */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

        {/* Navbar */}
        <Navbar onMenuClick={() => setMobileOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 relative">

          {/* Inner container */}
          <div className="max-w-7xl mx-auto w-full
                          bg-white/40 backdrop-blur-xl
                          border border-white/30
                          rounded-3xl
                          shadow-[0_8px_30px_rgba(0,0,0,0.05)]
                          p-4 sm:p-6 lg:p-8
                          animate-fade-in">

            <Outlet />

          </div>

        </main>
      </div>
    </div>
  );
};

export default AppLayout;