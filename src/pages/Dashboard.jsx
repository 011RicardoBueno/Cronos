import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalon } from '../context/SalonContext'; 
import { COLORS, UPCOMING_FEATURES } from '../constants/dashboard';

import DashboardHeader from '../components/layout/DashboardHeader';
import DashboardModules from '../components/dashboard/DashboardModules';
import SalonSetup from '../components/salon/SalonSetup'; // Importando o seu componente

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    salon,
    loading,
    error,
    needsSetup,      // Pego do contexto
    refreshSalon     // Para atualizar após o cadastro
  } = useSalon();

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: COLORS.deepCharcoal }}>
        Carregando dados...
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
          salonName={salon?.name || "Bem-vindo!"} 
          colors={COLORS}
          upcomingFeatures={UPCOMING_FEATURES}
        />

        {/* LÓGICA DE SETUP AUTOMÁTICO */}
        {needsSetup ? (
          <div style={{ marginTop: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ color: COLORS.deepCharcoal }}>Vamos configurar o seu salão</h2>
              <p style={{ color: COLORS.mutedTaupe }}>Parece que este é o seu primeiro acesso. Preencha os dados abaixo.</p>
            </div>
            <SalonSetup onComplete={refreshSalon} />
          </div>
        ) : (
          /* Se já tem salão, mostra o menu normal */
          <DashboardModules navigate={navigate} />
        )}

      </div>
    </div>
  );
}