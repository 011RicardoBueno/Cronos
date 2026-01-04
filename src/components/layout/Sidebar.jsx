import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, DollarSign, Box, Settings, X, Scissors, List, Star } from 'lucide-react';
import { useSalon } from '../../context/SalonContext';

export default function Sidebar({ isOpen, onClose }) {
  const { salon } = useSalon();
  const currentPlan = salon?.plan_type || 'iniciante';

  const links = [
    { to: '/', label: 'Dashboard', icon: <Home size={18} /> },
    { to: '/agenda', label: 'Agenda', icon: <Calendar size={18} /> },
    { to: '/profissionais', label: 'Profissionais', icon: <Users size={18} /> },
    { to: '/servicos', label: 'Serviços', icon: <Scissors size={18} /> },
    { to: '/analytics', label: 'Financeiro', icon: <DollarSign size={18} />, plan: 'profissional' },
    { to: '/admin/clientes', label: 'Clientes', icon: <Users size={18} /> },
    { to: '/produtos', label: 'Produtos', icon: <Box size={18} /> },
    { to: '/configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Overlay: escurece o fundo no mobile quando a sidebar abre */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-brand-surface border-r border-brand-muted/10 
        shadow-2xl lg:shadow-sm flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-primary">Cronos</h2>
          <button onClick={onClose} className="lg:hidden p-2 text-brand-muted hover:text-brand-text">
            <X size={24} />
          </button>
        </div>

        <nav className="px-3 py-2 flex flex-col gap-1 flex-1 overflow-y-auto">
          {links.map(({ to, label, icon, plan }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose} // Fecha ao clicar no mobile
              className={({ isActive }) => `
                flex items-center justify-between gap-3 p-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-brand-primary text-white shadow-md' 
                  : 'text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary'}
              `}
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="font-medium">{label}</span>
              </div>
              {plan && currentPlan === 'iniciante' && (
                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={10} /> PRO
                </span>
              )}
            </NavLink>
          ))}
        </nav>

      </aside>
    </>
  );
}