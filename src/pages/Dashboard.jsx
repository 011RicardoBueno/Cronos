import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { COLORS, UPCOMING_FEATURES } from '../constants/dashboard';

import DashboardHeader from '../components/layout/DashboardHeader';
import DashboardModules from '../components/dashboard/DashboardModules';
import ServicesSection from '../components/ServicesSection';

export default function Dashboard({ session }) {
  const navigate = useNavigate();

  // 1. Buscando os dados do Hook
  const {
    salon,
    services,
    loading,
    error,
    setServices
  } = useDashboardData(session, "all");

  // 2. ESTA PARTE É ESSENCIAL: Enquanto o loading for true, 
  // o React deve mostrar uma mensagem e não o Header vazio.
  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Carregando dados do salão...</div>;
  }

  if (error) {
    return <div style={{ padding: 40, color: "red", textAlign: "center" }}>Erro: {error}</div>;
  }

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        
        {/* 3. Aqui passamos o nome real do salão que veio do banco de dados */}
        <DashboardHeader
          salonName={salon?.name} 
          colors={COLORS}
          upcomingFeatures={UPCOMING_FEATURES}
        />

        <DashboardModules navigate={navigate} />

        <ServicesSection
          services={services}
          setServices={setServices}
          salonId={salon?.id}
          colors={COLORS}
        />
      </div>
    </div>
  );
}