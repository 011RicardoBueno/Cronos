import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-surface text-brand-text">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="lg:ml-64 min-h-screen transition-all duration-300 flex flex-col">
        <DashboardHeader onOpenSidebar={() => setIsSidebarOpen(true)} />
        
        <main className="p-4 md:p-8 flex-1">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}