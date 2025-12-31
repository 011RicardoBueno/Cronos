import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Users, DollarSign, TrendingUp, RefreshCw, CreditCard } from 'lucide-react';
import { COLORS } from '../../constants/dashboard';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import moment from 'moment';

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
        <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500', opacity: 0.8 }}>{trend}</span>
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
    realizedRevenue: 0,
    uniqueClients: 0,
    occupancyRate: 0,
    ticketMedio: 0,
    loading: true
  });

  const fetchDashboardData = useCallback(async (showIndicator = false) => {
    if (!professionals || professionals.length === 0 || !salon) {
      if (!salonLoading) setStatsData(prev => ({ ...prev, loading: false }));
      return;
    }

    if (showIndicator) setIsRefreshing(true);

    try {
      const startOfDay = moment().startOf('day').toISOString();
      const endOfDay = moment().endOf('day').toISOString();

      const { data, error } = await supabase
        .from('slots')
        .select(`id, client_id, status, services (price)`)
        .in('professional_id', professionals.map(p => p.id))
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay);

      if (error) throw error;

      // 1. Cálculos de Receita (Prevista vs Realizada)
      const expected = data?.reduce((acc, slot) => acc + (slot.services?.price || 0), 0) || 0;
      const realized = data?.filter(s => s.status === 'completed')
                           .reduce((acc, slot) => acc + (slot.services?.price || 0), 0) || 0;
      
      // 2. Ticket Médio
      const tMedio = data?.length > 0 ? expected / data.length : 0;

      // 3. Clientes Únicos
      const clientsSet = new Set(data?.map(s => s.client_id).filter(id => id));
      
      // 4. Ocupação Inteligente (Baseada no horário de funcionamento do Salon)
      const openHour = parseInt(salon?.opening_time?.split(':')[0] || 8);
      const closeHour = parseInt(salon?.closing_time?.split(':')[0] || 18);
      const hoursPerDay = closeHour - openHour;
      
      // Consideramos 1 slot = 30min de capacidade. 1 hora = 2 slots.
      const totalSlotsCapacity = professionals.length * hoursPerDay * 2;
      const occupancy = data?.length > 0 
        ? Math.min(Math.round((data.length / totalSlotsCapacity) * 100), 100) 
        : 0;

      setStatsData({
        todayCount: data?.length || 0,
        expectedRevenue: expected,
        realizedRevenue: realized,
        uniqueClients: clientsSet.size,
        occupancyRate: occupancy,
        ticketMedio: tMedio,
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
      trend: `${statsData.occupancyRate}% de ocupação`,
      color: COLORS.sageGreen,
      loading: statsData.loading || salonLoading
    },
    {
      label: "Ticket Médio",
      value: `R$ ${statsData.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      trend: "Média por cliente",
      color: COLORS.deepCharcoal,
      loading: statsData.loading || salonLoading
    },
    {
      label: "Receita Prevista",
      value: `R$ ${statsData.expectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      trend: "Total bruto hoje",
      color: "#2D6A4F",
      loading: statsData.loading || salonLoading
    },
    {
      label: "Já Recebido",
      value: `R$ ${statsData.realizedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CreditCard,
      trend: "Status: Concluído",
      color: "#3498db",
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
            borderRadius: '5px'
          }}
        >
          <RefreshCw 
            size={16} 
            style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} 
          />
          {isRefreshing ? 'Sincronizando...' : 'Sincronizar dados'}
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
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