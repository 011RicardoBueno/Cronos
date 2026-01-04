import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Scissors, 
  Settings, 
  DollarSign,
  Package // Importado para o novo módulo
} from 'lucide-react';
import DashboardCard from './cards/DashboardCard';
import { COLORS } from '../../constants/dashboard';
import NextClientWidget from './NextClientWidget';

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
      path: "/analytics",
      color: COLORS.deepCharcoal,
      badge: "PRO"
    },
    {
      title: "Produtos", // Novo módulo
      description: "Venda de itens e estoque",
      icon: <Package size={24} />,
      path: "/produtos",
      color: "#F59E0B" // Um tom de âmbar/laranja para diferenciar de serviços
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
      path: '/admin/clientes',
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
    <div>
      <NextClientWidget />
      <div style={styles.grid}>
        {modules.map((mod, index) => (
          <DashboardCard 
            key={index}
            title={mod.title}
            description={mod.description}
            icon={mod.icon}
            onClick={() => navigate(mod.path)}
            accentColor={mod.color}
            badge={mod.badge}
          />
        ))}
      </div>
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