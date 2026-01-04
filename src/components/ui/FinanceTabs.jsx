import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, List, Scissors, LineChart } from 'lucide-react';

const tabs = [
  { to: '/analytics', label: 'Visão Geral', icon: <BarChart3 size={16} /> },
  { to: '/financeiro/fluxo-caixa', label: 'Fluxo de Caixa', icon: <LineChart size={16} /> },
  { to: '/financeiro/transacoes', label: 'Transações', icon: <List size={16} /> },
  { to: '/financeiro/servicos', label: 'Serviços', icon: <Scissors size={16} /> },
];

export default function FinanceTabs() {
  return (
    <div className="mb-8 border-b border-brand-muted/10">
      <nav className="flex gap-2 -mb-px">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `
              flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-colors
              ${isActive 
                ? 'border-brand-primary text-brand-primary' 
                : 'border-transparent text-brand-muted hover:border-brand-muted/50 hover:text-brand-text'}
            `}
          >
            {tab.icon} {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}