import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import moment from 'moment';
import { Bar, Line } from 'react-chartjs-2';
import { Loader2, BarChart2, LineChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function MonthlyBalanceChart({ salonId }) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    if (salonId) fetchMonthlyData();
  }, [salonId]);

  const fetchMonthlyData = async () => {
    try {
      const startDate = moment().subtract(5, 'months').startOf('month');
      const endDate = moment().endOf('month');

      const { data, error } = await supabase
        .from('finance_transactions')
        .select('amount, type, created_at')
        .eq('salon_id', salonId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const months = {};
      for (let i = 0; i < 6; i++) {
        const m = moment().subtract(5 - i, 'months');
        const key = m.format('MMM/YY');
        months[key] = { income: 0, expense: 0 };
      }

      data.forEach(t => {
        const monthKey = moment(t.created_at).format('MMM/YY');
        if (months[monthKey]) {
          const val = Math.abs(t.amount);
          if (t.type === 'expense' || t.amount < 0) {
            months[monthKey].expense += val;
          } else {
            months[monthKey].income += val;
          }
        }
      });

      const labels = Object.keys(months);
      
      setChartData({
        labels,
        datasets: [
          {
            label: 'Receita',
            data: labels.map(l => months[l].income),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2,
            borderRadius: 4,
            tension: 0.4,
          },
          {
            label: 'Despesas',
            data: labels.map(l => months[l].expense),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 2,
            borderRadius: 4,
            tension: 0.4,
          }
        ]
      });

    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { 
        beginAtZero: true,
        ticks: {
          callback: (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value)
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  if (loading) return <div className="h-full flex items-center justify-center p-10"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {chartType === 'bar' ? <BarChart2 size={20} className="text-brand-primary" /> : <LineChart size={20} className="text-brand-primary" />}
          <h4 className="font-bold text-brand-text">Balanço Semestral</h4>
        </div>
        <div className="flex bg-brand-surface rounded-lg p-1 border border-brand-muted/20">
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-brand-card shadow text-brand-primary' : 'text-brand-muted hover:text-brand-text'}`}
            title="Gráfico de Barras"
          >
            <BarChart2 size={16} />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-brand-card shadow text-brand-primary' : 'text-brand-muted hover:text-brand-text'}`}
            title="Gráfico de Linhas"
          >
            <LineChart size={16} />
          </button>
        </div>
      </div>
      <div className="h-64">
        {chartType === 'bar' ? <Bar data={chartData} options={options} /> : <Line data={chartData} options={options} />}
      </div>
    </div>
  );
}