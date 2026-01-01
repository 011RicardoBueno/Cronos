import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-surface text-brand-text">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Barra Superior Mobile */}
      <div className="lg:hidden p-4 bg-brand-surface border-b border-brand-muted/10 sticky top-0 z-30 flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-2 text-brand-text hover:bg-brand-muted/10 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-lg font-bold text-brand-primary uppercase tracking-wider">Cronos</h2>
      </div>

      <main className="lg:ml-64 p-4 md:p-8 min-h-screen transition-all duration-300">
        {children || <Outlet />}
      </main>
    </div>
  );
}