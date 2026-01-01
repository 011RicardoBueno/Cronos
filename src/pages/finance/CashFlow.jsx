import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, TrendingUp, Users, Package, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FinanceTabs from '../../components/ui/FinanceTabs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CashFlow = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [stats, setStats] = useState({ total: 0, commissions: 0, products: 0, net: 0 });

  useEffect(() => {
    fetchTransactions();
  }, [dateRange]);

  async function fetchTransactions() {
    try {
      setLoading(true);
      let query = supabase
        .from('finance_transactions')
        .select(`*, professionals (name)`)
        .order('created_at', { ascending: true }); // Ascending para o gráfico fluir da esquerda para a direita

      if (dateRange.start) query = query.gte('created_at', `${dateRange.start}T00:00:00`);
      if (dateRange.end) query = query.lte('created_at', `${dateRange.end}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;

      setTransactions(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }

  const calculateStats = (data) => {
    const total = data.reduce((acc, curr) => acc + curr.amount, 0);
    const commissions = data.reduce((acc, curr) => acc + (curr.professional_commission || 0), 0);
    const products = data.filter(t => t.type === 'product').reduce((acc, curr) => acc + curr.amount, 0);
    setStats({ total, commissions, products, net: total - commissions });
  };

  // Processamento dos dados para o Gráfico (Memoizado para performance)
  const chartData = useMemo(() => {
    const grouped = transactions.reduce((acc, curr) => {
      const date = new Date(curr.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      if (!acc[date]) {
        acc[date] = { name: date, receita: 0, liquido: 0 };
      }
      acc[date].receita += curr.amount;
      acc[date].liquido += (curr.amount - (curr.professional_commission || 0));
      return acc;
    }, {});
    return Object.values(grouped);
  }, [transactions]);

  // Configuração dos dados para o Chart.js
  const chartConfig = useMemo(() => {
    const getVar = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

    return {
      labels: chartData.map(d => d.name),
      datasets: [
        {
          label: 'Receita',
          data: chartData.map(d => d.receita),
          borderColor: getVar('--color-brand-primary') || '#556B2F',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(85, 107, 47, 0.4)');
            gradient.addColorStop(1, 'rgba(85, 107, 47, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
        },
        {
          label: 'Líquido',
          data: chartData.map(d => d.liquido),
          borderColor: getVar('--color-brand-accent') || '#D4AF37',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
        }
      ]
    };
  }, [chartData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-brand-card').trim(),
        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--color-brand-text').trim(),
        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--color-brand-text').trim(),
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-brand-muted').trim(),
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: R$ ${context.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-brand-muted').trim(), font: { size: 11 } },
        border: { display: false }
      },
      y: { display: false }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="bg-brand-card p-2 rounded-xl border border-brand-muted/20 shadow-sm hover:bg-brand-muted/10">
              <ArrowLeft size={20} className="text-brand-text" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-brand-text">Fluxo de Caixa</h2>
              <p className="text-sm text-brand-muted">Análise de performance e histórico</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-brand-card p-2 rounded-xl border border-brand-muted/20 shadow-sm">
            <Calendar size={18} className="text-brand-muted ml-2" />
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))} className="bg-transparent text-brand-text text-sm outline-none p-1" />
            <span className="text-brand-muted">-</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))} className="bg-transparent text-brand-text text-sm outline-none p-1" />
          </div>
        </header>

        <FinanceTabs />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Bruto" value={stats.total} icon={<DollarSign className="text-green-500"/>} />
          <StatCard title="Comissões" value={stats.commissions} icon={<Users className="text-blue-500"/>} />
          <StatCard title="Produtos" value={stats.products} icon={<Package className="text-amber-500"/>} />
          <StatCard title="Líquido" value={stats.net} icon={<TrendingUp className="text-brand-primary"/>} isHighlight />
        </div>

        {/* GRÁFICO DE PERFORMANCE */}
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20 shadow-sm mb-8 h-[350px]">
          <h3 className="text-lg font-bold text-brand-text mb-6">Performance Financeira</h3>
          <div className="w-full h-[280px]">
            <Line data={chartConfig} options={chartOptions} />
          </div>
        </div>

        {/* TABELA DE TRANSAÇÕES */}
        <div className="bg-brand-card rounded-2xl border border-brand-muted/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-surface/50">
                <tr>
                  <th className="p-4 text-xs font-bold text-brand-muted uppercase">Data</th>
                  <th className="p-4 text-xs font-bold text-brand-muted uppercase">Tipo</th>
                  <th className="p-4 text-xs font-bold text-brand-muted uppercase">Líquido Salão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-muted/10">
                {transactions.slice().reverse().map(t => (
                  <tr key={t.id} className="hover:bg-brand-primary/5 transition-colors">
                    <td className="p-4 text-sm text-brand-text">{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.type === 'service' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-brand-primary">R$ {(t.amount - (t.professional_commission || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, isHighlight }) => (
  <div className={`bg-brand-card p-6 rounded-2xl border border-brand-muted/20 shadow-sm ${isHighlight ? 'border-b-4 border-b-brand-primary' : ''}`}>
    <div className="flex justify-between items-start mb-4">
      <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">{title}</span>
      {icon}
    </div>
    <h2 className="text-2xl font-bold text-brand-text">R$ {value.toFixed(2)}</h2>
  </div>
);

export default CashFlow;