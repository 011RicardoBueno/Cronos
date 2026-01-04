import React, { useEffect, useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import FinanceTabs from '../../components/ui/FinanceTabs';
import moment from 'moment';
import { 
  Scissors, 
  Award, 
  BarChart3,
  Loader2
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ServicePerformance() {
  const { salon } = useSalon();
  const { insights, loading, fetchAnalytics } = useAnalytics();
  const [startDate, setStartDate] = useState(moment().subtract(30, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));

  useEffect(() => {
    if (salon?.id) {
      fetchAnalytics(startDate, endDate);
    }
  }, [salon?.id, fetchAnalytics, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-brand-surface">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  const services = insights.topServices || [];
  const topRevenueService = services.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current, { revenue: 0, name: '-' });
  const topVolumeService = services.reduce((prev, current) => (prev.count > current.count) ? prev : current, { count: 0, name: '-' });

  const chartData = {
    labels: services.slice(0, 10).map(s => s.name),
    datasets: [
      {
        label: 'Faturamento (R$)',
        data: services.slice(0, 10).map(s => s.revenue),
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false }, ticks: { display: false } }
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">Performance de Serviços</h2>
            <div className="flex items-center gap-2 mt-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-brand-card border border-brand-muted/20 rounded-lg px-3 py-1.5 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              <span className="text-brand-muted text-sm">até</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-brand-card border border-brand-muted/20 rounded-lg px-3 py-1.5 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
        </header>

        <FinanceTabs />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><Award size={20} /></div>
              <span className="text-sm font-bold text-brand-muted">Campeão de Receita</span>
            </div>
            <h3 className="text-xl font-black text-brand-text truncate">{topRevenueService.name}</h3>
            <p className="text-brand-primary font-bold">R$ {topRevenueService.revenue?.toFixed(2)}</p>
          </div>
          <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><BarChart3 size={20} /></div>
              <span className="text-sm font-bold text-brand-muted">Mais Realizado</span>
            </div>
            <h3 className="text-xl font-black text-brand-text truncate">{topVolumeService.name}</h3>
            <p className="text-blue-600 font-bold">{topVolumeService.count} agendamentos</p>
          </div>
          <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-100 text-green-600"><Scissors size={20} /></div>
              <span className="text-sm font-bold text-brand-muted">Total Serviços</span>
            </div>
            <h3 className="text-xl font-black text-brand-text">{services.length}</h3>
            <p className="text-brand-muted text-sm">Tipos diferentes realizados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10">
            <h4 className="font-bold text-brand-text mb-6">Ranking de Faturamento</h4>
            <div className="h-64"><Bar data={chartData} options={chartOptions} /></div>
          </div>
          <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10">
            <h4 className="font-bold text-brand-text mb-6">Detalhamento</h4>
            <div className="overflow-y-auto max-h-64 space-y-2">
              {services.map((service, index) => (
                <div key={index} className="flex justify-between items-center p-3 hover:bg-brand-surface rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-brand-muted w-6 text-center">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-brand-text text-sm">{service.name}</p>
                      <p className="text-xs text-brand-muted">{service.count} realizados</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-text text-sm">R$ {service.revenue?.toFixed(2)}</p>
                    <p className="text-xs text-brand-muted">Méd: R$ {(service.revenue / service.count).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}