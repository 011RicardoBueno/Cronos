import React, { useEffect } from 'react';
import { useSalon } from '../../context/SalonContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { COLORS } from '../../constants/dashboard';
import RevenueChart from '../../components/RevenueChart';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Plus, 
  ArrowLeft,
  Loader2,
  BarChart3,
  Users,
  UserX,
  Award
} from 'lucide-react';

export default function Financeiro() {
  const { salon, professionals } = useSalon();
  const navigate = useNavigate();
  const { insights, loading, fetchAnalytics } = useAnalytics();

  const isBeta = true; 
  const hasProAccess = isBeta || salon?.plan_type === 'pro';

  useEffect(() => {
    if (salon?.id && professionals?.length) {
      fetchAnalytics(salon.id, professionals);
    }
  }, [salon, professionals, fetchAnalytics]);

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <Loader2 className="animate-spin" size={40} color={COLORS.sageGreen} />
        <p style={{ marginTop: '10px', color: '#666' }}>Gerando insights...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: COLORS.offWhite, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>
              <ArrowLeft size={20} color={COLORS.deepCharcoal} />
            </button>
            <div>
              <h2 style={{ color: COLORS.deepCharcoal, margin: 0 }}>Hub de Inteligência Financeira</h2>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Dados analíticos dos últimos 30 dias</p>
            </div>
          </div>
          <button style={styles.addBtn} onClick={() => alert("Módulo de lançamento manual em breve!")}>
            <Plus size={20} /> Novo Lançamento
          </button>
        </header>

        {/* 1. CARDS DE MÉTRICAS GLOBAIS */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#E8F5E9' }}>
              <TrendingUp color="#2E7D32" size={20} />
            </div>
            <div>
              <span style={styles.statLabel}>Faturamento (30d)</span>
              <h3 style={styles.statValue}>R$ {insights.stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#E3F2FD' }}>
              <BarChart3 color="#1565C0" size={20} />
            </div>
            <div>
              <span style={styles.statLabel}>Atendimentos Concluídos</span>
              <h3 style={styles.statValue}>{insights.stats.totalAppointments}</h3>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#FFF3E0' }}>
              <Users color="#E65100" size={20} />
            </div>
            <div>
              <span style={styles.statLabel}>Ticket Médio Geral</span>
              <h3 style={styles.statValue}>
                R$ {insights.stats.totalAppointments > 0 
                  ? (insights.stats.totalRevenue / insights.stats.totalAppointments).toFixed(2) 
                  : "0,00"}
              </h3>
            </div>
          </div>
        </div>

        {/* 2. RANKING DE PROFISSIONAIS & RETENÇÃO */}
        <div style={styles.doubleGrid}>
          {/* Performance por Profissional */}
          <div style={styles.sectionCard}>
            <div style={styles.cardHeader}>
              <Award size={20} color={COLORS.sageGreen} />
              <h4 style={{ margin: 0 }}>Performance da Equipe</h4>
            </div>
            <div style={{ marginTop: '15px' }}>
              {insights.professionalPerformance.map((pro, index) => (
                <div key={pro.id} style={styles.rankRow}>
                  <div style={styles.rankInfo}>
                    <span style={styles.rankNumber}>{index + 1}º</span>
                    <div>
                      <p style={styles.rankName}>{pro.name}</p>
                      <p style={styles.rankSub}>{pro.appointments} atendimentos</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={styles.rankValue}>R$ {pro.revenue.toFixed(2)}</p>
                    <p style={styles.rankSub}>T.M. R$ {pro.avgTicket.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clientes em Risco (Churn) */}
          <div style={styles.sectionCard}>
            <div style={styles.cardHeader}>
              <UserX size={20} color="#ef4444" />
              <h4 style={{ margin: 0 }}>Clientes Ausentes (+30 dias)</h4>
            </div>
            <div style={{ marginTop: '15px' }}>
              {insights.atRiskClients.length > 0 ? insights.atRiskClients.map(client => (
                <div key={client.id} style={styles.clientRow}>
                  <div>
                    <p style={styles.clientName}>{client.name}</p>
                    <p style={styles.clientSub}>Última vez: {moment(client.lastVisit).format('DD/MM/YYYY')}</p>
                  </div>
                  <span style={styles.daysBadge}>{client.daysAway} dias fora</span>
                </div>
              )) : (
                <p style={styles.emptyText}>Sua retenção está excelente! Nenhum cliente em risco.</p>
              )}
            </div>
          </div>
        </div>

        {/* 3. GRÁFICOS ANALÍTICOS */}
        <div style={styles.sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: COLORS.deepCharcoal }}>Tendência de Faturamento Semanal</h4>
            {isBeta && <span style={styles.betaBadge}>MODO BETA</span>}
          </div>
          <div style={{ position: 'relative', height: '300px' }}>
             {/* Note: Aqui você pode passar os dados processados pelo hook se desejar separar por dia */}
            <RevenueChart dataPoints={[0, 0, 0, 0, 0, 0, insights.stats.totalRevenue]} isCurrency={true} />
            {!hasProAccess && <LockOverlay />}
          </div>
        </div>
      </div>
    </div>
  );
}

const LockOverlay = () => (
  <div style={styles.lockOverlay}>
    <Lock size={30} color="white" />
    <p>Análise de tendências detalhada disponível no Plano Pro</p>
    <button style={styles.upgradeBtn}>Upgrade Agora</button>
  </div>
);

const styles = {
  loaderContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: COLORS.offWhite },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  backBtn: { background: 'white', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', border: 'none', backgroundColor: COLORS.deepCharcoal, color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' },
  doubleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { backgroundColor: 'white', padding: '25px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  iconBox: { padding: '12px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '14px', color: '#888', fontWeight: '500' },
  statValue: { margin: 0, fontSize: '22px', color: COLORS.deepCharcoal, fontWeight: '800' },
  sectionCard: { backgroundColor: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '10px' },
  rankRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #fafafa' },
  rankInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  rankNumber: { fontSize: '18px', fontWeight: 'bold', color: COLORS.sageGreen, minWidth: '30px' },
  rankName: { margin: 0, fontWeight: '600', color: COLORS.deepCharcoal },
  rankSub: { margin: 0, fontSize: '12px', color: '#999' },
  rankValue: { margin: 0, fontWeight: '700', color: COLORS.deepCharcoal },
  clientRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #fafafa' },
  clientName: { margin: 0, fontWeight: '600', color: COLORS.deepCharcoal },
  clientSub: { margin: 0, fontSize: '12px', color: '#999' },
  daysBadge: { backgroundColor: '#FFF1F0', color: '#F5222D', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', padding: '20px', fontSize: '14px' },
  betaBadge: { fontSize: '10px', backgroundColor: '#E8F5E9', color: COLORS.sageGreen, padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '20px', zIndex: 10 },
  upgradeBtn: { marginTop: '15px', padding: '10px 25px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.sageGreen, color: 'white', fontWeight: 'bold', cursor: 'pointer' }
};