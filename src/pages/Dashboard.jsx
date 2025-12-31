import React from 'react';
// Ajustado: Subindo um nível para sair de 'pages' e entrar em 'components'
import DashboardHeader from '../components/layout/DashboardHeader';
import DashboardStates from '../components/dashboard/DashboardStates'; 
import DashboardModules from '../components/dashboard/DashboardModules'; 
import RecentActivity from '../components/dashboard/RecentActivity';
import { useSalon } from '../context/SalonContext';
import { COLORS } from '../constants/dashboard';

export default function Dashboard() {
  const { salon, loading, error } = useSalon();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ color: '#666' }}>Carregando dados do salão...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ color: '#ef4444' }}>Erro ao carregar Dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.mainContainer}>
        
        <DashboardHeader />

        <section style={styles.section}>
           <h2 style={styles.sectionTitle}>
             Visão Geral de Hoje
           </h2>
           <DashboardStates /> 
        </section>

        <section style={styles.section}>
           <h2 style={styles.sectionTitle}>
             Gestão e Operação
           </h2>
           <DashboardModules />
        </section>

        <section style={styles.recentActivityCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.sectionTitle}>
              Próximos Agendamentos
            </h2>
            <span style={styles.badge}>Hoje</span>
          </div>
          
          <RecentActivity />
          
          <div style={styles.cardFooter}>
            <p style={styles.footerText}>
              Dica: Você pode gerenciar todos os horários na seção <strong>Agenda</strong>.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    backgroundColor: COLORS.offWhite,
    minHeight: '100vh',
    padding: '20px'
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  section: {
    marginBottom: '35px'
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: COLORS.deepCharcoal,
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  recentActivityCard: {
    backgroundColor: 'white', 
    padding: '24px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: `1px solid #f0f0f0`
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  badge: {
    backgroundColor: `${COLORS.sageGreen}20`,
    color: COLORS.sageGreen,
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  cardFooter: {
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #f9f9f9'
  },
  footerText: {
    color: '#999',
    fontSize: '0.85rem',
    margin: 0
  },
  loadingContainer: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.offWhite
  }
};