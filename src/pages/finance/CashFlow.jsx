import React, { useState, useEffect } from 'react';
import { useSalon } from '../../context/SalonContext';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';
import { DollarSign, TrendingUp, Users, Package, Calendar, ArrowLeft } from 'lucide-react';
import FinanceTabs from '../../components/ui/FinanceTabs';
import { useNavigate } from 'react-router-dom';

const CashFlow = () => {
  const { salon } = useSalon();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ total: 0, commissions: 0, products: 0, net: 0 });

  useEffect(() => {
    if (salon?.id) fetchFinanceData();
  }, [salon?.id]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('finance_transactions')
        .select(`*, professionals(name)`)
        .eq('salon_id', salon.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error("Erro financeiro:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totals = data.reduce((acc, curr) => {
      acc.total += curr.amount;
      acc.commissions += curr.professional_commission;
      if (curr.type === 'product') acc.products += curr.amount;
      return acc;
    }, { total: 0, commissions: 0, products: 0 });

    setStats({
      ...totals,
      net: totals.total - totals.commissions
    });
  };

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => navigate('/')} style={styles.backBtn}>
              <ArrowLeft size={20} color={COLORS.deepCharcoal} />
            </button>
            <div>
              <h2 style={{ color: COLORS.deepCharcoal, margin: 0 }}>Fluxo de Caixa</h2>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Histórico detalhado de entradas e saídas</p>
            </div>
          </div>
        </header>

        <FinanceTabs />

        <div style={styles.gridCards}>
          <StatCard title="Faturamento Bruto" value={stats.total} icon={<DollarSign color="#22c55e"/>} />
          <StatCard title="Comissões" value={stats.commissions} icon={<Users color="#3b82f6"/>} />
          <StatCard title="Produtos" value={stats.products} icon={<Package color="#f59e0b"/>} />
          <StatCard title="Líquido Salão" value={stats.net} icon={<TrendingUp color={COLORS.sageGreen}/>} isHighlight />
        </div>

        <div style={styles.tableCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Transações Detalhadas</h3>
            <div style={styles.dateFilter}>
              <Calendar size={16} /> <span>Últimos 30 dias</span>
            </div>
          </div>
          
          <table style={styles.table}>
            <thead>
              <tr style={styles.thr}>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Profissional</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Valor Total</th>
                <th style={styles.th}>Comissão</th>
                <th style={styles.th}>Líquido</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? transactions.map(t => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={styles.td}><strong>{t.professionals?.name || 'Sistema'}</strong></td>
                  <td style={styles.td}>
                    <span style={{...styles.badge, backgroundColor: t.type === 'product' ? '#fef3c7' : '#dcfce7'}}>
                      {t.type === 'service' ? 'Serviço' : 'Produto'}
                    </span>
                  </td>
                  <td style={styles.td}>R$ {t.amount.toFixed(2)}</td>
                  <td style={{...styles.td, color: '#ef4444'}}>- R$ {t.professional_commission.toFixed(2)}</td>
                  <td style={{...styles.td, fontWeight: 'bold', color: COLORS.sageGreen}}>
                    R$ {(t.amount - t.professional_commission).toFixed(2)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Nenhuma transação encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, isHighlight }) => (
  <div style={{...styles.card, borderBottom: isHighlight ? `4px solid ${COLORS.sageGreen}` : 'none'}}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
      <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</span>
      {icon}
    </div>
    <h2 style={{ margin: 0, color: COLORS.deepCharcoal }}>R$ {value.toFixed(2)}</h2>
  </div>
);

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  backBtn: { background: 'white', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex' },
  gridCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  dateFilter: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: '8px', fontSize: '13px', color: '#666' },
  tableCard: { backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thr: { borderBottom: `2px solid ${COLORS.offWhite}` },
  th: { padding: '12px', fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' },
  tr: { borderBottom: `1px solid ${COLORS.offWhite}` },
  td: { padding: '16px 12px', fontSize: '14px', color: COLORS.deepCharcoal },
  badge: { padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: '#555' }
};

export default CashFlow;