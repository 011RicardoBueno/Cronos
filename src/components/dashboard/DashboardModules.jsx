import React from 'react';
import DashboardCard from './cards/DashboardCard';
import { COLORS } from '../../constants/dashboard';

export default function DashboardModules({ navigate }) {
  const modules = [
    { title: 'Agenda', description: 'Visualizar e gerenciar agendamentos', route: '/agenda' },
    { title: 'Serviços', description: 'Gerenciar catálogo de serviços', route: '/services' },
    { title: 'Fidelidade', description: 'Programa de fidelidade e clientes VIP', route: '/loyalty' },
    { title: 'Comissões', description: 'Visualizar e controlar comissões', route: '/commissions' },
    { title: 'Pagamentos', description: 'Controle de pagamentos online', route: '/payments' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      margin: '30px 0'
    }}>
      {modules.map(mod => (
        <DashboardCard
          key={mod.title}
          title={mod.title}
          description={mod.description}
          colors={COLORS}
          onClick={() => navigate(mod.route)}
        />
      ))}
    </div>
  );
}
