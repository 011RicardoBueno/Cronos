import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, DollarSign, Box, Settings } from 'lucide-react';

export default function Sidebar() {
  const links = [
    { to: '/', label: 'Dashboard', icon: <Home size={18} /> },
    { to: '/agenda', label: 'Agenda', icon: <Calendar size={18} /> },
    { to: '/admin/clientes', label: 'Clientes', icon: <Users size={18} /> },
    { to: '/financeiro', label: 'Financeiro', icon: <DollarSign size={18} /> },
    { to: '/produtos', label: 'Produtos', icon: <Box size={18} /> },
    { to: '/configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-md">
      <div className="p-6">
        <h2 className="text-lg font-bold text-brand-primary">Cronos</h2>
      </div>
      <nav className="px-3 py-2 flex flex-col gap-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-semibold' : ''} bg-brand-surface text-brand-primary`}
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
