import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Scissors, 
  Settings, 
  DollarSign 
} from 'lucide-react';
import DashboardCard from './cards/DashboardCard';
import { COLORS } from '../../constants/dashboard';

const DashboardModules = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Agenda",
      description: "Gerenciar horários e serviços",
      icon: <Calendar size={24} />,
      path: "/agenda",
      color: COLORS.sageGreen
    },
    {
      title: "Financeiro",
      description: "Lucro, despesas e comissões",
      icon: <DollarSign size={24} />,
      path: "/financeiro",
      color: COLORS.deepCharcoal,
      badge: "PRO"
    },
    {
      title: "Profissionais",
      description: "Equipe, especialidades e acesso",
      icon: <Users size={24} />,
      path: "/profissionais",
      color: COLORS.deepCharcoal
    },
    {
      title: "Serviços",
      description: "Menu de tratamentos e preços",
      icon: <Scissors size={24} />,
      path: "/servicos",
      color: COLORS.sageGreen
    },
    {
      title: 'Clientes',
      icon: <Users size={24} />,
      path: '/admin/clientes', // Ajustado conforme sua estrutura de pastas
      description: 'Fidelidade e Histórico',
      color: "#6366F1", 
      badge: 'CRM'
    },
    {
      title: "Configurações",
      description: "Dados do salão e horários",
      icon: <Settings size={24} />,
      path: "/configuracoes",
      color: COLORS.warmSand
    }
  ];

  return (
    <div style={styles.grid}>
      {modules.map((mod, index) => (
        <DashboardCard 
          key={index}
          title={mod.title}
          description={mod.description}
          icon={mod.icon}
          onClick={() => navigate(mod.path)}
          accentColor={mod.color}
          badge={mod.badge} // Passando o badge para o card
        />
      ))}
    </div>
  );
};

const styles = {
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
    gap: '20px',
    marginTop: '10px'
  }
};

export default DashboardModules;