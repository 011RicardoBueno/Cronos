import React, { useState, useEffect } from 'react';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import RevenueChart from '../../components/RevenueChart';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Plus, 
  ArrowLeft,
  Loader2
} from 'lucide-react';

export default function Financeiro() {
  const { salon } = useSalon();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalIncome: 0, totalCommission: 0, netProfit: 0 });
  const [chartData, setChartData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [history, setHistory] = useState([]);

  // Lógica de Plano
  const isBeta = true; 
  const hasProAccess = isBeta || salon?.plan_type === 'pro';

  useEffect(() => {
    if (salon?.id) {
      fetchFinanceData();
    }
  }, [salon]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      
      // 1. Buscar transações do mês atual
      const startOfMonth = moment().startOf('month').toISOString();
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('salon_id', salon.id)
        .gte('created_at', startOfMonth)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Calcular Totais
      const income = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const commission = data.reduce((acc, curr) => acc + (curr.professional_commission || 0), 0);
      
      setStats({
        totalIncome: income,
        totalCommission: commission,
        netProfit: income - commission
      });
      setHistory(data.slice(0, 5)); // Últimos 5 lançamentos para a tabela

      // 3. Preparar dados para o Gráfico (Últimos 7 dias)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
        const dayTotal = data
          .filter(t => moment(t.created_at).format('YYYY-MM-DD') === date)
          .reduce((acc, curr) => acc + curr.amount, 0);
        last7Days.push(dayTotal);
      }
      setChartData(last7Days);

    } catch (err) {
      console.error("Erro ao carregar financeiro:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: COLORS.offWhite }}>
        <Loader2 className="animate-spin" size={40} color={COLORS.sageGreen} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: COLORS.offWhite, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>
              <ArrowLeft size={20} color={COLORS.deepCharcoal} />
            </button>
            <div>
              <h2 style={{ color: COLORS.deepCharcoal, margin: 0 }}>Gestão Financeira</h2>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Dados reais baseados nos atendimentos</p>
            </div>
          </div>
          <button style={styles.addBtn} onClick={() => alert("Módulo de lançamento manual em breve!")}>
            <Plus size={20} /> Novo Lançamento
          </button>
        </header>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#E8F5E9' }}>
              <TrendingUp color="#2E7D32" size={20} />
            </div>
            <div>
              <span style={styles.statLabel}>Entradas (Mês)</span>
              <h3 style={styles.statValue}>R$ {stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#FFEBEE' }}>
              <TrendingDown color="#C62828" size={20} />
            </div>
            <div>
              <span style={styles.statLabel}>Comissões</span>
              <h3 style={styles.statValue}>R$ {stats.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#E3F2FD' }}>
              <DollarSign color="#1565C0" size={20} />
            </div>
            <div>
              <span style={styles.statLabel}>Lucro Líquido</span>
              <h3 style={styles.statValue}>R$ {stats.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: COLORS.deepCharcoal }}>Faturamento dos Últimos 7 Dias</h4>
            {isBeta && <span style={styles.betaBadge}>MODO BETA</span>}
          </div>
          
          <div style={{ position: 'relative', height: '300px' }}>
            <RevenueChart dataPoints={chartData} />
            {!hasProAccess && (
              <div style={styles.lockOverlay}>
                <Lock size={30} color="white" />
                <p>Gráficos detalhados no Plano Pro</p>
                <button style={styles.upgradeBtn}>Fazer Upgrade</button>
              </div>
            )}
          </div>
        </div>

        <div style={styles.sectionCard}>
          <h4 style={{ marginBottom: '20px', color: COLORS.deepCharcoal }}>Últimas Transações</h4>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Data</span>
              <span>Descrição</span>
              <span>Valor</span>
              <span>Comissão</span>
            </div>
            {history.length > 0 ? history.map((item) => (
              <div key={item.id} style={styles.tableRow}>
                <span>{moment(item.created_at).format('DD/MM')}</span>
                <span style={{ fontWeight: '500' }}>{item.description}</span>
                <span>R$ {item.amount.toFixed(2)}</span>
                <span style={{ color: '#C62828' }}>- R$ {item.professional_commission.toFixed(2)}</span>
              </div>
            )) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Nenhuma transação este mês.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  backBtn: { background: 'white', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', border: 'none', backgroundColor: COLORS.deepCharcoal, color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  iconBox: { padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '13px', color: '#888', fontWeight: '500' },
  statValue: { margin: 0, fontSize: '18px', color: COLORS.deepCharcoal, fontWeight: '700' },
  sectionCard: { backgroundColor: 'white', padding: '25px', borderRadius: '20px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
  betaBadge: { fontSize: '10px', backgroundColor: '#E8F5E9', color: COLORS.sageGreen, padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '20px' },
  upgradeBtn: { marginTop: '15px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: COLORS.sageGreen, color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  table: { display: 'flex', flexDirection: 'column' },
  tableHeader: { display: 'grid', gridTemplateColumns: '0.5fr 2fr 1fr 1fr', padding: '12px', borderBottom: '1px solid #eee', color: '#888', fontSize: '13px', fontWeight: '600' },
  tableRow: { display: 'grid', gridTemplateColumns: '0.5fr 2fr 1fr 1fr', padding: '16px', borderBottom: '1px solid #fafafa', alignItems: 'center', fontSize: '14px', color: COLORS.deepCharcoal }
};