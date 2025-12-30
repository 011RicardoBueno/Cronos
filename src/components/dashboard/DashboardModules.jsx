import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Scissors, Settings } from 'lucide-react';
import DashboardCard from './cards/DashboardCard';
// Importamos direto da sua constante para garantir que nunca seja undefined
import { COLORS } from '../../constants/dashboard';

const DashboardModules = () => {
  const navigate = useNavigate();

  // Usamos COLORS (importado) em vez de colors (vinda de props)
  const modules = [
    {
      title: "Agenda",
      description: "Gerenciar horários e serviços",
      icon: <Calendar size={24} />,
      path: "/agenda",
      color: COLORS.sageGreen
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
      title: "Configurações",
      description: "Dados do salão e horários",
      icon: <Settings size={24} />,
      path: "/configuracoes",
      color: COLORS.warmBeige
    }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '20px',
      marginTop: '30px' 
    }}>
      {modules.map((mod, index) => (
        <DashboardCard 
          key={index}
          title={mod.title}
          description={mod.description}
          icon={mod.icon}
          onClick={() => navigate(mod.path)}
          accentColor={mod.color}
        />
      ))}
    </div>
  );
};

export default DashboardModules;