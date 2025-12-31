import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Users, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { COLORS } from '../../constants/dashboard';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import moment from 'moment'; // Importante para manipulação de datas

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
  const { professionals, salon, loading: salonLoading } = useSalon();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statsData, setStatsData] = useState({
    todayCount: 0,
    expectedRevenue: 0,
    uniqueClients: 0,
    occupancyRate: 0,
    loading: true
  });

  const fetchDashboardData = useCallback(async (showIndicator = false) => {
    // Se ainda não carregou o salão ou não tem profissionais, não busca
    if (!professionals || professionals.length === 0 || !salon) {
      if (!salonLoading) setStatsData(prev => ({ ...prev, loading: false }));
      return;
    }

    if (showIndicator) setIsRefreshing(true);

    try {
      // Usamos moment para garantir que pegamos o dia de hoje no fuso local
      const startOfDay = moment().startOf('day').toISOString();
      const endOfDay = moment().endOf('day').toISOString();

      const { data, error } = await supabase
        .from('slots')
        .select(`id, client_id, services (price)`)
        .in('professional_id', professionals.map(p => p.id))
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay);

      if (error) throw error;

      // Cálculos
      const count = data?.length || 0;
      const revenue = data?.reduce((acc, slot) => acc + (slot.services?.price || 0), 0);
      
      // Contagem de clientes únicos hoje
      const clientsSet = new Set(data?.map(s => s.client_id).filter(id => id));
      
      // Cálculo simplificado de ocupação: 
      // (Agendamentos / (Profissionais * 10 horas de trabalho)) * 100
      const estimatedCapacity = professionals.length * 10; 
      const occupancy = count > 0 ? Math.min(Math.round((count / estimatedCapacity) * 100), 100) : 0;

      setStatsData({
        todayCount: count,
        expectedRevenue: revenue,
        uniqueClients: clientsSet.size,
        occupancyRate: occupancy,
        loading: false
      });
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [professionals, salon, salonLoading]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
      label: "Clientes Hoje",
      value: statsData.uniqueClients.toString(),
      icon: Users,
      trend: "Pessoas únicas",
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
      value: `${statsData.occupancyRate}%`,
      icon: TrendingUp,
      trend: "Capacidade",
      color: "#f39c12", // Cor de destaque para ocupação
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
        >
          <RefreshCw 
            size={16} 
            style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              transition: 'all 0.2s'
            }} 
          />
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