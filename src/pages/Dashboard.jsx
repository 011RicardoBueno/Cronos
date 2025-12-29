import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalon } from '../context/SalonContext'; 
import { COLORS, UPCOMING_FEATURES } from '../constants/dashboard';

import DashboardHeader from '../components/layout/DashboardHeader';
import DashboardModules from '../components/dashboard/DashboardModules';

export default function Dashboard() {
  const navigate = useNavigate();

  // Agora pegamos apenas o necessário para o Hub principal
  const {
    salon,
    loading,
    error
  } = useSalon();

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: COLORS.deepCharcoal }}>
        Carregando dados do salão...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, color: "red", textAlign: "center" }}>
        Erro ao carregar painel: {error}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        
        <DashboardHeader
          salonName={salon?.name} 
          colors={COLORS}
          upcomingFeatures={UPCOMING_FEATURES}
        />

        {/* Este componente é agora o controle central. 
            Certifique-se de que o card de "Serviços" nele 
            esteja chamando navigate('/servicos')
        */}
        <DashboardModules navigate={navigate} />

      </div>
    </div>
  );
}