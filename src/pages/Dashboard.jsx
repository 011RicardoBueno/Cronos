import React from 'react';
import DashboardHeader from '../components/layout/DashboardHeader';
import DashboardStates from '../components/dashboard/DashboardStates'; // Para os KPIs
import DashboardModules from '../components/dashboard/DashboardModules'; // Os cards que já fizemos
import { COLORS } from '../constants/dashboard';

export default function Dashboard() {
  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* 1. Cabeçalho com boas-vindas */}
        <DashboardHeader />

        {/* 2. Seção de KPIs (O que você pediu: métricas rápidas) */}
        <section style={{ marginBottom: '30px' }}>
           <h2 style={{ fontSize: '1.2rem', color: COLORS.deepCharcoal, marginBottom: '15px' }}>
             Visão Geral de Hoje
           </h2>
           <DashboardStates /> 
        </section>

        {/* 3. Atalhos de Módulos (O que já temos: Agenda, Profissionais, etc) */}
        <section style={{ marginBottom: '30px' }}>
           <h2 style={{ fontSize: '1.2rem', color: COLORS.deepCharcoal, marginBottom: '15px' }}>
             Gestão e Operação
           </h2>
           <DashboardModules />
        </section>

        {/* 4. Histórico e Atividade Recente (Espaço para o histórico de atendimentos) */}
        <section style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '16px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
        }}>
          <h2 style={{ fontSize: '1.2rem', color: COLORS.deepCharcoal, marginBottom: '15px' }}>
            Últimos Atendimentos
          </h2>
          {/* Aqui entrará uma tabela ou lista simplificada futuramente */}
          <p style={{ color: '#666' }}>Nenhuma atividade recente registrada hoje.</p>
        </section>

      </div>
    </div>
  );
}