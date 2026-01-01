import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { COLORS } from '../../constants/dashboard';
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
    <div style={styles.container}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              ...styles.tab,
              color: isActive ? COLORS.sageGreen : '#666',
              borderBottom: isActive ? `3px solid ${COLORS.sageGreen}` : '3px solid transparent',
              backgroundColor: isActive ? '#f0f4f1' : 'transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    gap: '10px',
    marginBottom: '25px',
    borderBottom: '1px solid #eee',
    padding: '0 10px'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    borderRadius: '8px 8px 0 0',
  }
};

export default FinanceTabs;