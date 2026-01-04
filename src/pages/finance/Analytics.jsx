import React, { useEffect, useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useNavigate } from 'react-router-dom';
import RevenueChart from '../../components/RevenueChart';
import ExpenseModal from '../../components/ExpenseModal';
import MonthlyComparison from '../../components/MonthlyComparison';
import MonthlyGoal from '../../components/MonthlyGoal';
import MonthlyBalanceChart from '../../components/MonthlyBalanceChart';
import RevenueForecast from '../../components/RevenueForecast';
import FinanceTabs from '../../components/ui/FinanceTabs';
import moment from 'moment';
import { 
  TrendingUp,
  TrendingDown, 
  Plus, 
  ArrowLeft,
  Loader2,
  BarChart3,
  UserX,
  Award,
  Receipt,
  PieChart,
  CreditCard,
  Ticket,
  Scissors
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Analytics() {
  const { salon, professionals } = useSalon();
  const navigate = useNavigate();
  const { insights, loading, fetchAnalytics } = useAnalytics();
  const { insights: prevInsights, loading: prevLoading, fetchAnalytics: fetchPrevAnalytics } = useAnalytics();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(moment().subtract(30, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));

  const isBeta = true; 
  const _hasProAccess = isBeta || salon?.plan_type === 'pro';

  useEffect(() => {
    if (salon?.id) {
      fetchAnalytics(startDate, endDate);
      
      // Calcular período anterior (mesmo intervalo, mês passado)
      const prevStart = moment(startDate).subtract(1, 'month').format('YYYY-MM-DD');
      const prevEnd = moment(endDate).subtract(1, 'month').format('YYYY-MM-DD');
      fetchPrevAnalytics(prevStart, prevEnd);
    }
  }, [salon?.id, fetchAnalytics, fetchPrevAnalytics, startDate, endDate]);

  const paymentChartData = {
    labels: insights.revenueByPaymentMethod?.map(item => item.name) || [],
    datasets: [
      {
        data: insights.revenueByPaymentMethod?.map(item => item.value) || [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: 'var(--brand-card)',
        borderWidth: 2,
      },
    ],
  };

  const paymentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'var(--brand-muted)',
          boxWidth: 12,
          padding: 15,
          font: {
            weight: 'bold'
          }
        }
      },
    },
  };

  const professionalChartData = {
    labels: insights.professionalPerformance?.map(p => p.name.split(' ')[0]) || [],
    datasets: [
      {
        label: 'Faturamento',
        data: insights.professionalPerformance?.map(p => p.revenue) || [],
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const professionalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { display: false }, ticks: { display: false } },
      x: { grid: { display: false } }
    }
  };

  if (loading || prevLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-brand-surface">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
        <p className="mt-4 text-brand-muted">Calculando balanço real...</p>
      </div>
    );
  }

  const totalAppointments = insights.professionalPerformance?.reduce((acc, curr) => acc + (curr.appointments || 0), 0) || 0;
  const globalTicket = totalAppointments > 0 ? insights.stats.totalRevenue / totalAppointments : 0;

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">Hub de Inteligência</h2>
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-brand-card border border-brand-muted/20 rounded-lg px-3 py-1.5 text-sm text-brand-text focus:outline-none focus:border-brand-primary transition-colors"
              />
              <span className="text-brand-muted text-sm">até</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-brand-card border border-brand-muted/20 rounded-lg px-3 py-1.5 text-sm text-brand-text focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>
          </div>
          <button onClick={() => setIsExpenseModalOpen(true)} className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
            <Plus size={20} /> Nova Despesa
          </button>
        </header>

        <FinanceTabs />

        {/* 1. CARDS DE MÉTRICAS GLOBAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-card rounded-3xl p-6 flex items-center gap-4 border border-brand-muted/10">
            <div className="p-3 rounded-xl bg-green-100">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <span className="text-sm font-semibold text-brand-muted">Faturamento Bruto</span>
              <h3 className="text-2xl font-black text-brand-text">R$ {insights.stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="bg-brand-card rounded-3xl p-6 flex items-center gap-4 border border-brand-muted/10">
            <div className="p-3 rounded-xl bg-red-100">
              <TrendingDown className="text-red-600" size={24} />
            </div>
            <div>
              <span className="text-sm font-semibold text-brand-muted">Total Despesas + Comissões</span>
              <h3 className="text-2xl font-black text-red-500">
                R$ {(insights.stats.totalRevenue - insights.stats.netProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-brand-card rounded-3xl p-6 flex items-center gap-4 border-2 border-brand-primary">
            <div className="p-3 rounded-xl bg-brand-primary/10">
              <PieChart className="text-brand-primary" size={24} />
            </div>
            <div>
              <span className="text-sm font-semibold text-brand-muted">Lucro Líquido Real</span>
              <h3 className="text-2xl font-black text-brand-primary">
                R$ {insights.stats.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-brand-card rounded-3xl p-6 flex items-center gap-4 border border-brand-muted/10">
            <div className="p-3 rounded-xl bg-blue-100">
              <Ticket className="text-blue-600" size={24} />
            </div>
            <div>
              <span className="text-sm font-semibold text-brand-muted">Ticket Médio Global</span>
              <h3 className="text-2xl font-black text-brand-text">R$ {globalTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>

        {/* PREVISÕES E METAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MonthlyGoal currentRevenue={insights.stats.totalRevenue} />
          <RevenueForecast salonId={salon?.id} />
          <MonthlyComparison 
            title="Evolução Faturamento"
            current={insights.stats.totalRevenue}
            previous={prevInsights?.stats?.totalRevenue}
          />
        </div>

        {/* BALANÇO SEMESTRAL */}
        <div className="mb-8">
          <MonthlyBalanceChart salonId={salon?.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10">
            <div className="flex items-center gap-3 border-b border-brand-muted/10 pb-4 mb-4">
              <Award size={20} className="text-brand-primary" />
              <h4 className="font-bold text-brand-text">Performance da Equipe</h4>
            </div>
            <div className="h-48 mb-4">
              <Bar data={professionalChartData} options={professionalChartOptions} />
            </div>
            <div className="space-y-2">
              {insights.professionalPerformance.map((pro, index) => (
                <div key={pro.id || index} className="flex justify-between items-center py-2 border-b border-brand-surface last:border-none">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-brand-primary w-6 text-center">{index + 1}º</span>
                    <div>
                      <p className="font-semibold text-brand-text">{pro.name}</p>
                      <p className="text-xs text-brand-muted">{pro.appointments || 0} atendimentos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-text">R$ {(pro.revenue || 0).toFixed(2)}</p>
                    <p className="text-xs text-brand-muted">T.M. R$ {(pro.avgTicket || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10">
            <div className="flex items-center gap-3 border-b border-brand-muted/10 pb-4 mb-4">
              <CreditCard size={20} className="text-brand-primary" />
              <h4 className="font-bold text-brand-text">Receita por Pagamento</h4>
            </div>
            <div className="h-64 flex items-center justify-center">
              {insights.revenueByPaymentMethod?.length > 0 ? (
                <Pie data={paymentChartData} options={paymentChartOptions} />
              ) : (
                <p className="text-brand-muted text-sm">Sem dados de pagamento.</p>
              )}
            </div>
          </div>

          <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10">
            <div className="flex items-center gap-3 border-b border-brand-muted/10 pb-4 mb-4">
              <Scissors size={20} className="text-brand-primary" />
              <h4 className="font-bold text-brand-text">Top Serviços</h4>
            </div>
            <div className="space-y-2">
              {insights.topServices?.length > 0 ? insights.topServices.map((service, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-brand-surface last:border-none">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-brand-muted w-6 text-center">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-brand-text">{service.name}</p>
                      <p className="text-xs text-brand-muted">{service.count} realizados</p>
                    </div>
                  </div>
                  <span className="font-bold text-brand-text">R$ {(service.revenue || 0).toFixed(2)}</span>
                </div>
              )) : (
                <p className="text-center text-brand-muted p-4 text-sm">Nenhum serviço registrado.</p>
              )}
            </div>
          </div>

          <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10">
            <div className="flex items-center gap-3 border-b border-brand-muted/10 pb-4 mb-4">
              <Receipt size={20} className="text-red-500" />
              <h4 className="font-bold text-brand-text">Despesas Recentes</h4>
            </div>
            <div className="space-y-2">
              {insights.recentExpenses?.length > 0 ? insights.recentExpenses.map(exp => (
                <div key={exp.id} className="flex justify-between items-center py-2 border-b border-brand-surface last:border-none">
                  <div>
                    <p className="font-semibold text-brand-text">{exp.description}</p>
                    <p className="text-xs text-brand-muted">{exp.category} • {moment(exp.date).format('DD/MM')}</p>
                  </div>
                  <span className="font-bold text-red-500">- R$ {(exp.amount || 0).toFixed(2)}</span>
                </div>
              )) : (
                <p className="text-center text-brand-muted p-4 text-sm">Nenhuma despesa registrada este mês.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10 mb-8">
          <div className="flex items-center gap-3 border-b border-brand-muted/10 pb-4 mb-4">
            <UserX size={20} className="text-red-500" />
            <h4 className="font-bold text-brand-text">Radar de Retenção: Clientes Ausentes (+30 dias)</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {insights.atRiskClients.length > 0 ? insights.atRiskClients.map(client => (
              <div key={client.id} className="bg-brand-surface p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-semibold text-brand-text text-sm">{client.name || 'Cliente anônimo'}</p>
                  <p className="text-xs text-brand-muted">Última visita: {moment(client.lastVisit).format('DD/MM/YY')}</p>
                </div>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-xs font-bold">{client.daysAway || 0} dias</span>
              </div>
            )) : (
              <p className="text-center text-brand-muted p-4 text-sm col-span-full">Retenção de 100% no período!</p>
            )}
          </div>
        </div>

        <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-brand-text">Tendência de Faturamento</h4>
            {isBeta && <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-md font-bold">MODO BETA</span>}
          </div>
          <div style={{ position: 'relative', height: '300px' }}>
            <RevenueChart dataPoints={[0, 0, 0, 0, 0, 0, insights.stats.totalRevenue]} isCurrency={true} />
          </div>
        </div>
      </div>

      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        salonId={salon?.id}
        onSuccess={() => fetchAnalytics(startDate, endDate)}
      />
    </div>
  );
}