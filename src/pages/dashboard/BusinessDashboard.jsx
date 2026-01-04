import React, { useEffect, useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import toast from 'react-hot-toast';
import { 
  DollarSign, TrendingUp, Users, ArrowUpRight, Award, Calendar, TrendingDown, PieChart
, Loader2 } from 'lucide-react';
import LowStockWidget from '../../components/widgets/LowStockWidget';
import StatCard from '../../components/widgets/StatCard';
import { 
  fetchRecentAppointments, 
  subscribeToNewAppointments, 
  unsubscribeFromChannel,
  fetchSlotById
} from '../../services/supabaseService';

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
  const { insights, loading, fetchAnalytics } = useAnalytics();
  const [chartData, setChartData] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    if (!salon?.id) return;
    fetchAnalytics();
  }, [salon?.id, fetchAnalytics]);

  // Effect to process chart data when insights change
  useEffect(() => {
    if (insights?.professionalPerformance) {
        const serviceMap = insights.professionalPerformance.reduce((acc, pro) => {
            acc[pro.name] = (acc[pro.name] || 0) + pro.revenue;
            return acc;
        }, {});
        
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#556B2F';

        setChartData({
          labels: Object.keys(serviceMap),
          datasets: [{
            label: 'Faturamento por Profissional',
            data: Object.values(serviceMap),
            backgroundColor: primaryColor,
            borderRadius: 8,
            borderSkipped: false,
          }]
        });
    }
  }, [insights]);

  // Realtime Notifications & Recent Appointments
  useEffect(() => {
    if (!salon?.id) return;

    const fetchRecent = async () => {
      try {
        const data = await fetchRecentAppointments(salon.id);
        setRecentAppointments(data);
      } catch (error) {
        console.error("Failed to fetch recent appointments:", error);
        toast.error("Falha ao buscar agendamentos recentes.");
      }
    };
    fetchRecent();

    const handleNewAppointment = async (payload) => {
      // Play Sound
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
      audio.play().catch(e => console.warn("Audio play blocked", e));

      try {
        // Fetch full details (with service name)
        const newSlot = await fetchSlotById(payload.new.id);
        setRecentAppointments(prev => [newSlot, ...prev].slice(0, 10));
        toast.success(`Novo Agendamento: ${newSlot.client_name}`);
      } catch (error) {
        console.error("Failed to process new appointment notification:", error);
      }
    };

    const channel = subscribeToNewAppointments(salon.id, handleNewAppointment);

    return () => {
      unsubscribeFromChannel(channel);
    };
  }, [salon?.id]);

  // Configurações do Gráfico
  const chartOptions = {
    indexAxis: 'y', // Gráfico horizontal para facilitar leitura de nomes longos
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'var(--dash-card)',
        padding: 12,
        cornerRadius: 10,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { display: false }, border: { display: false } },
      y: { grid: { display: false }, border: { display: false } }
    }
  };

  if (loading) return (
      <div className="flex flex-col justify-center items-center h-screen bg-brand-surface text-brand-muted">
        <Loader2 className="animate-spin text-brand-primary mb-4" size={32} />
        <p className="font-semibold">Carregando painel...</p>
      </div>
  );

  return (
    <div className="space-y-8 p-6 bg-brand-surface min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-primary">Painel de Gestão</h1>
          <p className="text-sm text-brand-muted mt-1">Visão geral da performance do seu negócio.</p>
        </div>
      </header>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Faturamento Bruto"
          value={Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insights.stats.totalRevenue)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Custos Totais"
          value={Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insights.stats.totalExpenses)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Lucro Líquido"
          value={Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insights.stats.netProfit)}
          icon={PieChart}
          color="primary"
        />
        <StatCard
          title="Ticket Médio"
          value={Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insights.stats.totalRevenue / (insights.stats.totalAppointments || 1))}
          icon={DollarSign}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-brand-card p-6 rounded-2xl border border-brand-muted/20">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Ranking de Serviços</h3>
          <div style={{ height: '300px' }}>
            {chartData && <Bar data={chartData} options={chartOptions} />}
          </div>
        </div>

        <div className="lg:col-span-1">
          <LowStockWidget salonId={salon?.id} />
        </div>

      </div>

      {/* Recent Appointments Section */}
      <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Últimos Agendamentos (Tempo Real)</h3>
        <div className="space-y-3">
          {recentAppointments.map(slot => (
            <div key={slot.id} className="flex justify-between items-center p-3 bg-brand-surface rounded-xl border border-brand-muted/10 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="font-bold text-brand-text">{slot.client_name}</p>
                  <p className="text-xs text-brand-muted">
                    {slot.services?.name} • {new Date(slot.start_time).toLocaleDateString('pt-BR')} às {new Date(slot.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-green-100 text-green-600 px-2 py-1 rounded-lg">
                Novo
              </span>
            </div>
          ))}
          {recentAppointments.length === 0 && <p className="text-brand-muted text-sm">Nenhum agendamento recente.</p>}
        </div>
      </div>
    </div>
  );
}
