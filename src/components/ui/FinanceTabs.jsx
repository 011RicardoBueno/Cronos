import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReceiptText, BarChart3 } from 'lucide-react';

const FinanceTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'fluxo',
      label: 'Fluxo de Caixa',
      path: '/financeiro',
      icon: <ReceiptText size={18} />
    },
    {
      id: 'analytics',
      label: 'Inteligência (BI)',
      path: '/analytics',
      icon: <BarChart3 size={18} />
    }
  ];

  return (
    <div className="flex gap-2 mb-6 border-b border-brand-muted/10 px-2">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`
              flex items-center gap-2 px-5 py-3 border-b-2 transition-all duration-200 font-semibold text-sm rounded-t-lg
              ${isActive 
                ? 'border-brand-primary text-brand-primary bg-brand-primary/5' 
                : 'border-transparent text-brand-muted hover:text-brand-text hover:bg-brand-muted/5'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
export default FinanceTabs;