import React from 'react';
import DashboardHeader from '../components/layout/DashboardHeader';
import DashboardStates from '../components/dashboard/DashboardStates'; 
import DashboardModules from '../components/dashboard/DashboardModules'; 
import RecentActivity from '../components/dashboard/RecentActivity';
import { useSalon } from '../context/SalonContext';
import { COLORS } from '../constants/dashboard';
import { LayoutGrid } from 'lucide-react'; // Importe para o ícone do título

export default function Dashboard() {
  const { salon, loading, error } = useSalon();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#666', marginTop: '15px' }}>Carregando dados do salão...</p>
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
           <div style={styles.headerRow}>
             <h2 style={styles.sectionTitle}>
               <LayoutGrid size={20} /> Gestão e Operação
             </h2>
           </div>
           {/* Este componente agora incluirá o card de 'Clientes' */}
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
              Dica: Clientes inativos aparecem em destaque na nova seção <strong>Clientes</strong>.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

const styles = {
  // ... (mantenha seus estilos anteriores)
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  sectionTitle: {
    fontSize: '1.1rem', // Leve ajuste para harmonia visual
    fontWeight: '700',
    color: COLORS.deepCharcoal,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  recentActivityCard: {
    backgroundColor: 'white', 
    padding: '24px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: `1px solid #f0f0f0`,
    marginBottom: '40px' // Espaço extra no final para mobile
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.offWhite
  },
  // Adicionado um pequeno estilo de spinner para feedback visual
  spinner: {
    width: '30px',
    height: '30px',
    border: `3px solid ${COLORS.warmSand}`,
    borderTop: `3px solid ${COLORS.sageGreen}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};