import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Scissors, Settings } from 'lucide-react';
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
      color: COLORS.warmSand // Ajustado para usar uma cor da sua paleta consistente
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
        />
      ))}
    </div>
  );
};

const styles = {
  grid: { 
    display: 'grid', 
    // Garante que em telas muito pequenas (mobile) os cards ocupem a largura toda
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
    gap: '20px',
    marginTop: '10px' // Reduzi um pouco para alinhar melhor com o título da seção no Dashboard.jsx
  }
};

export default DashboardModules;