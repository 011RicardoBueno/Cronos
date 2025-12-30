import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Users, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { COLORS } from '../../constants/dashboard';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';

const StatCard = ({ label, value, icon: Icon, trend, color, loading }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flex: '1'
  }}>
    <div style={{ backgroundColor: `${color}15`, padding: '12px', borderRadius: '12px', color: color }}>
      <Icon size={24} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ margin: 0, color: '#666', fontSize: '0.85rem', fontWeight: '500' }}>{label}</p>
      <h3 style={{ margin: '4px 0', fontSize: '1.4rem', color: COLORS.deepCharcoal }}>
        {loading ? '...' : value}
      </h3>
      {trend && (
        <span style={{ fontSize: '0.75rem', color: '#2D6A4F', fontWeight: '600' }}>{trend}</span>
      )}
    </div>
  </div>
);

export default function DashboardStates() {
  const { professionals, loading: salonLoading } = useSalon();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statsData, setStatsData] = useState({
    todayCount: 0,
    expectedRevenue: 0,
    loading: true
  });

  const fetchDashboardData = useCallback(async (showIndicator = false) => {
    if (!professionals || professionals.length === 0) {
      setStatsData(prev => ({ ...prev, loading: false }));
      return;
    }

    if (showIndicator) setIsRefreshing(true);

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString();
      const endOfDay = new Date(today.setHours(23,59,59,999)).toISOString();

      const { data, error } = await supabase
        .from('slots')
        .select(`id, services (price)`)
        .in('professional_id', professionals.map(p => p.id))
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay);

      if (error) throw error;

      const count = data?.length || 0;
      const revenue = data?.reduce((acc, slot) => acc + (slot.services?.price || 0), 0);

      setStatsData({
        todayCount: count,
        expectedRevenue: revenue,
        loading: false
      });
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    } finally {
      setIsRefreshing(false);
      setStatsData(prev => ({ ...prev, loading: false }));
    }
  }, [professionals]);

  useEffect(() => {
    if (!salonLoading && professionals?.length > 0) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, professionals, salonLoading]);

  const stats = [
    {
      label: "Agendamentos Hoje",
      value: statsData.todayCount.toString(),
      icon: CalendarCheck,
      trend: "Total do dia",
      color: COLORS.sageGreen,
      loading: statsData.loading || salonLoading
    },
    {
      label: "Novos Clientes",
      value: "---",
      icon: Users,
      trend: "Este mês",
      color: COLORS.deepCharcoal,
      loading: statsData.loading || salonLoading
    },
    {
      label: "Receita Prevista",
      value: `R$ ${statsData.expectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      trend: "Total bruto",
      color: "#2D6A4F",
      loading: statsData.loading || salonLoading
    },
    {
      label: "Ocupação",
      value: "---",
      icon: TrendingUp,
      trend: "Eficiência",
      color: COLORS.warmBeige,
      loading: statsData.loading || salonLoading
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => fetchDashboardData(true)}
          disabled={isRefreshing || statsData.loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '5px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = COLORS.sageGreen}
          onMouseLeave={(e) => e.target.style.color = '#666'}
        >
          <RefreshCw size={16} className={isRefreshing ? 'spin-animation' : ''} style={{
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar dados'}
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px' 
      }}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}