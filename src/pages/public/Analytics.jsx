import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import moment from 'moment';
import 'moment/locale/pt-br';
import { 
  TrendingUp, Users, Calendar, DollarSign, 
  Activity, Scissors, Loader2, Download
} from 'lucide-react';

// Registro dos componentes do ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

moment.locale('pt-br');

export default function Analytics() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    revenue: 0,
    volume: 0,
    retention: 0,
    avgTicket: 0
  });
  const [chartsData, setChartsData] = useState({
    revenue: null,
    services: null,
    professionals: null
  });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let startDate = moment();
      if (period === '7d') startDate.subtract(7, 'days');
      if (period === '30d') startDate.subtract(30, 'days');
      if (period === '1y') startDate.subtract(1, 'year');

      const { data: slots, error } = await supabase
        .from('slots')
        .select(`
          id,
          start_time,
          client_phone,
          status,
          services (name, price),
          professionals (name)
        `)
        .eq('status', 'confirmed')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', moment().endOf('day').toISOString());

      if (error) throw error;

      processMetrics(slots);
      processCharts(slots, startDate);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMetrics = (data) => {
    const totalRevenue = data.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
    const totalVolume = data.length;
    
    // Retenção: Clientes com mais de 1 agendamento no período
    const clientCounts = {};
    data.forEach(s => {
      if (s.client_phone) {
        clientCounts[s.client_phone] = (clientCounts[s.client_phone] || 0) + 1;
      }
    });
    const returningClients = Object.values(clientCounts).filter(count => count > 1).length;
    const uniqueClients = Object.keys(clientCounts).length;
    const retentionRate = uniqueClients > 0 ? (returningClients / uniqueClients) * 100 : 0;

    setMetrics({
      revenue: totalRevenue,
      volume: totalVolume,
      retention: retentionRate,
      avgTicket: totalVolume > 0 ? totalRevenue / totalVolume : 0
    });
  };

  const processCharts = (data, startDate) => {
    // 1. Line Chart: Evolução de Faturamento
    const revenueByDate = {};
    const dateFormat = period === '1y' ? 'MMM YYYY' : 'DD/MM';
    
    let current = moment(startDate);
    const end = moment();
    while (current <= end) {
      revenueByDate[current.format(dateFormat)] = 0;
      current.add(1, period === '1y' ? 'month' : 'day');
    }

    data.forEach(slot => {
      const dateKey = moment(slot.start_time).format(dateFormat);
      if (revenueByDate[dateKey] !== undefined) {
        revenueByDate[dateKey] += (slot.services?.price || 0);
      }
    });

    const revenueData = {
      labels: Object.keys(revenueByDate),
      datasets: [{
        label: 'Faturamento (R$)',
        data: Object.values(revenueByDate),
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)'); // brand-primary alpha
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
          return gradient;
        },
        borderColor: '#6366f1', // brand-primary
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#6366f1',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }]
    };

    // 2. Doughnut: Mix de Serviços
    const serviceCounts = {};
    data.forEach(slot => {
      const name = slot.services?.name || 'Outros';
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });
    
    const sortedServices = Object.entries(serviceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const servicesData = {
      labels: sortedServices.map(([name]) => name),
      datasets: [{
        data: sortedServices.map(([,count]) => count),
        backgroundColor: [
          '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'
        ],
        borderWidth: 0,
        hoverOffset: 10
      }]
    };

    // 3. Bar: Performance da Equipe
    const profRevenue = {};
    data.forEach(slot => {
      const name = slot.professionals?.name || 'Indefinido';
      profRevenue[name] = (profRevenue[name] || 0) + (slot.services?.price || 0);
    });

    const sortedProfs = Object.entries(profRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const professionalsData = {
      labels: sortedProfs.map(([name]) => name),
      datasets: [{
        label: 'Receita (R$)',
        data: sortedProfs.map(([,amount]) => amount),
        backgroundColor: '#6366f1',
        borderRadius: 12,
        maxBarThickness: 40,
      }]
    };

    setChartsData({
      revenue: revenueData,
      services: servicesData,
      professionals: professionalsData
    });
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b', // brand-card background
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: '#71717a', font: { size: 10, weight: '600' } } 
      },
      y: { 
        grid: { color: 'rgba(255,255,255,0.05)', borderDash: [5, 5] }, 
        ticks: { 
          color: '#71717a', 
          font: { size: 10 },
          callback: (value) => `R$ ${value}`
        },
        border: { display: false } 
      }
    }
  };

  if (loading && !chartsData.revenue) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-brand-primary gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="text-brand-muted font-medium animate-pulse">Carregando inteligência de dados...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-text tracking-tight mb-1">Analytics</h1>
          <p className="text-brand-muted font-medium italic">Transformando agendamentos em estratégia.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-brand-card p-1 rounded-2xl border border-brand-muted/10 shadow-inner">
            {[{ id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '1y', label: '1A' }].map((p) => (
              <button 
                key={p.id} 
                onClick={() => setPeriod(p.id)} 
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                  period === p.id 
                  ? 'bg-brand-primary text-white shadow-lg' 
                  : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="p-3 bg-brand-card text-brand-muted rounded-2xl border border-brand-muted/10 hover:text-brand-primary transition-colors">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Faturamento Bruto" 
          value={`R$ ${metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<DollarSign size={20} />}
          color="text-emerald-500"
        />
        <SummaryCard 
          title="Agendamentos" 
          value={metrics.volume} 
          icon={<Calendar size={20} />}
          color="text-blue-500"
        />
        <SummaryCard 
          title="Ticket Médio" 
          value={`R$ ${metrics.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<Activity size={20} />}
          color="text-purple-500"
        />
        <SummaryCard 
          title="Taxa de Retenção" 
          value={`${metrics.retention.toFixed(1)}%`} 
          icon={<Users size={20} />}
          color="text-orange-500"
        />
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico Principal: Evolução */}
        <div className="lg:col-span-2 bg-brand-card/30 backdrop-blur-xl rounded-[2.5rem] p-8 border border-brand-muted/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-brand-text flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-primary" /> Faturamento no Período
            </h3>
          </div>
          <div className="h-[350px] w-full">
            {chartsData.revenue && <Line data={chartsData.revenue} options={commonOptions} />}
          </div>
        </div>

        {/* Mix de Serviços */}
        <div className="bg-brand-card/30 backdrop-blur-xl rounded-[2.5rem] p-8 border border-brand-muted/10">
          <h3 className="text-xl font-black text-brand-text mb-8 flex items-center gap-2">
            <Scissors size={20} className="text-brand-primary" /> Mix de Serviços
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {chartsData.services && (
              <Doughnut 
                data={chartsData.services} 
                options={{ 
                  ...commonOptions, 
                  cutout: '75%', 
                  plugins: { 
                    ...commonOptions.plugins, 
                    legend: { 
                      display: true, 
                      position: 'bottom',
                      labels: { 
                        color: '#71717a',
                        usePointStyle: true,
                        font: { size: 11, weight: '600' },
                        padding: 20
                      } 
                    } 
                  } 
                }} 
              />
            )}
          </div>
        </div>

        {/* Performance por Profissional */}
        <div className="lg:col-span-3 bg-brand-card/30 backdrop-blur-xl rounded-[2.5rem] p-8 border border-brand-muted/10">
          <h3 className="text-xl font-black text-brand-text mb-8">Performance por Profissional (Receita)</h3>
          <div className="h-[300px] w-full">
            {chartsData.professionals && <Bar data={chartsData.professionals} options={commonOptions} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  return (
    <div className="group bg-brand-card/50 hover:bg-brand-card rounded-[2.5rem] p-8 border border-brand-muted/10 transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-4 bg-brand-surface rounded-2xl border border-brand-muted/5 ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-brand-muted text-xs font-black uppercase tracking-widest">{title}</p>
          <h4 className="text-2xl font-black text-brand-text tracking-tighter">{value}</h4>
        </div>
      </div>
      <div className="w-full h-1 bg-brand-surface rounded-full overflow-hidden">
        <div className={`h-full opacity-50 ${color.replace('text', 'bg')}`} style={{ width: '60%' }} />
      </div>
    </div>
  );
}