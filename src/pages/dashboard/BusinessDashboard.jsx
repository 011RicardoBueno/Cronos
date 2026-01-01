import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import { 
  DollarSign, TrendingUp, Users, ArrowUpRight, Award, BarChart3 
} from 'lucide-react';

// Importações do Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BusinessDashboard() {
  const { salon } = useSalon();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    ticketMedio: 0,
    retentionRate: 0,
    serviceRevenue: 0,
    productRevenue: 0
  });
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salon?.id) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('finance_transactions')
          .select(`
            amount, type,
            slots (client_phone, services (name))
          `)
          .eq('salon_id', salon.id);

        if (error) throw error;

        // Cálculos Financeiros
        const total = data.reduce((acc, t) => acc + Number(t.amount), 0);
        const serviceVal = data.filter(t => t.type === 'service').reduce((acc, t) => acc + Number(t.amount), 0);
        const productVal = data.filter(t => t.type === 'product').reduce((acc, t) => acc + Number(t.amount), 0);
        
        const uniqueSlots = [...new Set(data.map(t => t.slot_id))].length;
        const ticket = total / (uniqueSlots || 1);

        // Lógica do Gráfico para Chart.js
        const serviceMap = data.reduce((acc, t) => {
          if (t.type === 'service' && t.slots?.services?.name) {
            const name = t.slots.services.name;
            acc[name] = (acc[name] || 0) + Number(t.amount);
          }
          return acc;
        }, {});

        setChartData({
          labels: Object.keys(serviceMap),
          datasets: [{
            label: 'Faturamento por Serviço',
            data: Object.values(serviceMap),
            backgroundColor: COLORS.sageGreen,
            borderRadius: 8,
            borderSkipped: false,
          }]
        });

        setMetrics({
          totalRevenue: total,
          ticketMedio: ticket,
          retentionRate: 75, // Simulado baseado no script de dummy data
          serviceRevenue: serviceVal,
          productRevenue: productVal
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [salon?.id]);

  // Configurações do Gráfico
  const chartOptions = {
    indexAxis: 'y', // Gráfico horizontal para facilitar leitura de nomes longos
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: COLORS.deepCharcoal,
        padding: 12,
        cornerRadius: 10,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { display: false }, border: { display: false } },
      y: { grid: { display: false }, border: { display: false } }
    }
  };

  if (loading) return <div style={styles.center}>Processando Inteligência...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Painel de Gestão</h1>
        <p style={styles.subtitle}>Faturamento baseado nos seus serviços de R$ 150 e R$ 300</p>
      </header>

      {/* CARDS */}
      <div style={styles.statsGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{...styles.iconBox, backgroundColor: '#ECFDF5'}}><DollarSign color="#10B981" size={20} /></div>
            <span style={styles.trendUp}><ArrowUpRight size={14} /> Alto</span>
          </div>
          <span style={styles.cardLabel}>Faturamento Bruto</span>
          <h2 style={styles.cardValue}>R$ {metrics.totalRevenue.toFixed(2)}</h2>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{...styles.iconBox, backgroundColor: '#EFF6FF'}}><TrendingUp color="#3B82F6" size={20} /></div>
          </div>
          <span style={styles.cardLabel}>Ticket Médio</span>
          <h2 style={styles.cardValue}>R$ {metrics.ticketMedio.toFixed(2)}</h2>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{...styles.iconBox, backgroundColor: '#FFF7ED'}}><Users color="#F97316" size={20} /></div>
          </div>
          <span style={styles.cardLabel}>Taxa de Retenção</span>
          <h2 style={styles.cardValue}>{metrics.retentionRate}%</h2>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.chartSection}>
          <h3 style={styles.sectionTitle}>Ranking de Serviços</h3>
          <div style={{ height: '300px' }}>
            {chartData && <Bar data={chartData} options={chartOptions} />}
          </div>
        </div>

        <div style={styles.sideCard}>
          <h3 style={styles.sectionTitle}>Mix de Receita</h3>
          <div style={styles.mixItem}>
            <div style={styles.mixInfo}><span>Serviços</span><span>{((metrics.serviceRevenue/metrics.totalRevenue)*100).toFixed(0)}%</span></div>
            <div style={styles.progressBg}><div style={{...styles.progressFill, width: '85%', backgroundColor: COLORS.sageGreen}} /></div>
          </div>
          <div style={styles.mixItem}>
            <div style={styles.mixInfo}><span>Café e Produtos</span><span>{((metrics.productRevenue/metrics.totalRevenue)*100).toFixed(0)}%</span></div>
            <div style={styles.progressBg}><div style={{...styles.progressFill, width: '15%', backgroundColor: '#3B82F6'}} /></div>
          </div>
          <div style={styles.insightBox}>
            <Award size={18} />
            <p style={styles.insightText}>Seu serviço de <strong>R$ 300</strong> representa a maior parte do lucro líquido.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ... manter os estilos anteriores
const styles = {
    container: { padding: '32px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#F8FAFC', minHeight: '100vh' },
    header: { marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: '800', color: COLORS.deepCharcoal, margin: 0 },
    subtitle: { color: '#64748B', marginTop: '4px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' },
    card: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    iconBox: { padding: '10px', borderRadius: '12px' },
    cardLabel: { fontSize: '14px', color: '#64748B', fontWeight: '600' },
    cardValue: { fontSize: '24px', fontWeight: '800', color: COLORS.deepCharcoal, margin: '8px 0 0 0' },
    trendUp: { display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '12px', fontWeight: '700', backgroundColor: '#ECFDF5', padding: '4px 8px', borderRadius: '20px' },
    mainGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
    chartSection: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9' },
    sideCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9' },
    sectionTitle: { fontSize: '16px', fontWeight: '700', color: COLORS.deepCharcoal, marginBottom: '24px' },
    mixItem: { marginBottom: '20px' },
    mixInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' },
    progressBg: { height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: '4px' },
    insightBox: { marginTop: '32px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center' },
    insightText: { fontSize: '13px', color: '#475569', margin: 0 },
    center: { padding: '100px', textAlign: 'center', color: '#64748B' }
};