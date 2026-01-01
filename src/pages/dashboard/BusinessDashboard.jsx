import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { 
  DollarSign, TrendingUp, Users, ArrowUpRight, Award 
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
            backgroundColor: '#556B2F', // brand primary hex
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
        backgroundColor: '#403D39', // deepCharcoal hex
        padding: 12,
        cornerRadius: 10,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { display: false }, border: { display: false } },
      y: { grid: { display: false }, border: { display: false } }
    }
  };

  if (loading) return <div className="py-20 text-center text-brand-muted">Processando Inteligência...</div>;

  return (
    <div className="space-y-8 p-6 bg-brand-surface min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-primary">Painel de Gestão</h1>
          <p className="text-sm text-brand-muted mt-1">Faturamento baseado nos seus serviços de R$ 150 e R$ 300</p>
        </div>
      </header>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-[#ECFDF5]">
              <DollarSign color="#10B981" size={20} />
            </div>
            <span className="text-xs font-semibold text-[#10B981] inline-flex items-center gap-1"><ArrowUpRight size={14} /> Alto</span>
          </div>
          <span className="text-sm font-medium text-brand-muted">Faturamento Bruto</span>
          <h2 className="text-2xl font-bold text-brand-text mt-2">R$ {metrics.totalRevenue.toFixed(2)}</h2>
        </div>

        <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-[#EFF6FF]">
              <TrendingUp color="#3B82F6" size={20} />
            </div>
          </div>
          <span className="text-sm font-medium text-brand-muted">Ticket Médio</span>
          <h2 className="text-2xl font-bold text-brand-text mt-2">R$ {metrics.ticketMedio.toFixed(2)}</h2>
        </div>

        <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-[#FFF7ED]">
              <Users color="#F97316" size={20} />
            </div>
          </div>
          <span className="text-sm font-medium text-brand-muted">Taxa de Retenção</span>
          <h2 className="text-2xl font-bold text-brand-text mt-2">{metrics.retentionRate}%</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-brand-card p-6 rounded-2xl border border-brand-muted/20">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Ranking de Serviços</h3>
          <div style={{ height: '300px' }}>
            {chartData && <Bar data={chartData} options={chartOptions} />}
          </div>
        </div>

        <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Mix de Receita</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm font-semibold mb-2"><span>Serviços</span><span>{((metrics.serviceRevenue/metrics.totalRevenue)*100).toFixed(0)}%</span></div>
              <div className="h-2 bg-brand-muted/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '85%', backgroundColor: '#556B2F' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm font-semibold mb-2"><span>Café e Produtos</span><span>{((metrics.productRevenue/metrics.totalRevenue)*100).toFixed(0)}%</span></div>
              <div className="h-2 bg-brand-muted/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '15%', backgroundColor: '#3B82F6' }} />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 bg-brand-surface p-3 rounded-lg">
              <Award size={18} />
              <p className="text-sm text-brand-muted m-0">Seu serviço de <strong>R$ 300</strong> representa a maior parte do lucro líquido.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
