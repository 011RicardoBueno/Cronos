import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, TrendingUp, Users, Package, Calendar, PieChart } from 'lucide-react';
import FinanceTabs from '../../components/ui/FinanceTabs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CashFlow = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [stats, setStats] = useState({ totalRevenue: 0, totalExpenses: 0, commissions: 0, products: 0, net: 0 });

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
    let totalRevenue = 0;
    let totalExpenses = 0;
    let commissions = 0;
    let products = 0;

    data.forEach(t => {
      const val = Number(t.amount);
      // Assumindo que 'expense' é despesa e os outros (income, service, product) são receitas
      // Se o valor vier negativo do banco, usamos Math.abs para somar nos totalizadores corretos
      if (t.type === 'expense') {
        totalExpenses += Math.abs(val);
      } else {
        totalRevenue += Math.abs(val);
        if (t.type === 'product') products += Math.abs(val);
      }

      if (t.professional_commission) {
        commissions += Number(t.professional_commission);
      }
    });

    setStats({ 
      totalRevenue, 
      totalExpenses,
      commissions, 
      products, 
      net: totalRevenue - totalExpenses - commissions 
    });
  };

  // Processamento dos dados para o Gráfico (Memoizado para performance)
  const chartData = useMemo(() => {
    const grouped = transactions.reduce((acc, curr) => {
      const date = new Date(curr.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      if (!acc[date]) {
        acc[date] = { name: date, receita: 0, liquido: 0 };
      }
      
      const val = Number(curr.amount);
      if (curr.type === 'expense') {
        acc[date].liquido -= Math.abs(val);
      } else {
        acc[date].receita += Math.abs(val);
        acc[date].liquido += (Math.abs(val) - (curr.professional_commission || 0));
      }
      
      return acc;
    }, {});
    return Object.values(grouped);
  }, [transactions]);

  // Dados para o Gráfico de Pizza (Despesas por Categoria/Descrição)
  const expensePieData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, curr) => {
      // Usando a descrição como "categoria" já que não temos campo categoria explícito
      const cat = curr.description || 'Outros'; 
      acc[cat] = (acc[cat] || 0) + Math.abs(Number(curr.amount));
      return acc;
    }, {});

    // Ordenar e pegar os top 5
    const sorted = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sorted.map(([name]) => name),
      datasets: [
        {
          data: sorted.map(([, value]) => value),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',   // Red
            'rgba(249, 115, 22, 0.8)',  // Orange
            'rgba(234, 179, 8, 0.8)',   // Yellow
            'rgba(168, 85, 247, 0.8)',  // Purple
            'rgba(100, 116, 139, 0.8)', // Slate
          ],
          borderColor: 'var(--brand-card)',
          borderWidth: 2,
        },
      ],
    };
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

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'var(--brand-muted)',
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
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
          <StatCard title="Bruto" value={stats.totalRevenue} icon={<DollarSign className="text-green-500"/>} />
          <StatCard title="Comissões" value={stats.commissions} icon={<Users className="text-blue-500"/>} />
          <StatCard title="Produtos" value={stats.products} icon={<Package className="text-amber-500"/>} />
          <StatCard title="Líquido" value={stats.net} icon={<TrendingUp className="text-brand-primary"/>} isHighlight />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* GRÁFICO DE PERFORMANCE (LINHA) */}
          <div className="lg:col-span-2 bg-brand-card p-6 rounded-2xl border border-brand-muted/20 shadow-sm h-[350px]">
            <h3 className="text-lg font-bold text-brand-text mb-6">Performance Financeira</h3>
            <div className="w-full h-[280px]">
              <Line data={chartConfig} options={chartOptions} />
            </div>
          </div>

          {/* GRÁFICO DE DESPESAS (PIZZA) */}
          <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20 shadow-sm h-[350px]">
            <div className="flex items-center gap-2 mb-6">
              <PieChart size={20} className="text-red-500" />
              <h3 className="text-lg font-bold text-brand-text">Despesas por Categoria</h3>
            </div>
            <div className="w-full h-[250px] flex items-center justify-center">
              {expensePieData.datasets[0].data.length > 0 ? (
                <Pie data={expensePieData} options={pieOptions} />
              ) : (
                <p className="text-brand-muted text-sm">Nenhuma despesa no período.</p>
              )}
            </div>
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
    <h2 className="text-2xl font-bold text-brand-text">
      {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    </h2>
  </div>
);

export default CashFlow;