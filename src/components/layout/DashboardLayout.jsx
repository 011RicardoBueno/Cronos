import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout({ children }) {
  // If `children` is provided we render it (used in some places), otherwise render nested routes via <Outlet />
  return (
    <div className="min-h-screen bg-brand-surface text-brand-text">
      <Sidebar />
      <main className="ml-64 p-6 min-h-screen">
        {children || <Outlet />}
      </main>
    </div>
  );
}
