import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, TrendingUp, DollarSign, UserCheck, RefreshCw } from 'lucide-react';
import { COLORS } from '../../constants/dashboard';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import moment from 'moment';

const StatCard = ({ label, value, icon, trend, color, loading }) => (
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
      {React.isValidElement(icon) ? icon : (icon ? React.createElement(icon, { size: 24 }) : null)}
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ margin: 0, color: '#666', fontSize: '0.85rem', fontWeight: '500' }}>{label}</p>
      <h3 style={{ margin: '4px 0', fontSize: '1.4rem', color: COLORS.deepCharcoal, fontWeight: '700' }}>
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
    uniqueClients: 0,
    recurrentClients: 0,
    ticketMedio: 0,
    loading: true
  });

  const fetchDashboardData = useCallback(async (showIndicator = false) => {
    if (!professionals?.length || !salon) {
      if (!salonLoading) setStatsData(prev => ({ ...prev, loading: false }));
      return;
    }

    if (showIndicator) setIsRefreshing(true);

    try {
      // Agora buscamos apenas o dia de HOJE para performance
      const startOfToday = moment().startOf('day').toISOString();
      const endOfToday = moment().endOf('day').toISOString();

      const { data, error } = await supabase
        .from('slots')
        .select(`id, client_id, status, start_time, services (price)`)
        .in('professional_id', professionals.map(p => p.id))
        .neq('status', 'cancelled')
        .gte('start_time', startOfToday)
        .lte('start_time', endOfToday);

      if (error) throw error;

      // Cálculo das métricas
      const expected = data.reduce((acc, slot) => acc + (slot.services?.price || 0), 0);
      const tMedio = data.length > 0 ? expected / data.length : 0;
      const clientsIds = data.map(s => s.client_id).filter(id => id);
      const unique = new Set(clientsIds).size;

      setStatsData({
        todayCount: data.length,
        expectedRevenue: expected,
        uniqueClients: unique,
        recurrentClients: clientsIds.length - unique,
        ticketMedio: tMedio,
        loading: false
      });
    } catch (err) {
      console.error("Erro ao carregar métricas do dashboard:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [professionals, salon, salonLoading]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: COLORS.deepCharcoal, fontWeight: '700' }}>
          Resumo de Hoje
        </h3>
        <button 
          onClick={() => fetchDashboardData(true)} 
          disabled={isRefreshing}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span style={{ fontSize: '12px' }}>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px' 
      }}>
        <StatCard 
          label="Agendamentos" 
          value={statsData.todayCount} 
          icon={CalendarCheck} 
          color={COLORS.sageGreen} 
          loading={statsData.loading || salonLoading} 
        />
        <StatCard 
          label="Ticket Médio" 
          value={`R$ ${statsData.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={TrendingUp} 
          color={COLORS.deepCharcoal} 
          loading={statsData.loading || salonLoading} 
        />
        <StatCard 
          label="Receita Prevista" 
          value={`R$ ${statsData.expectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={DollarSign} 
          color="#2D6A4F" 
          loading={statsData.loading || salonLoading} 
        />
        <StatCard 
          label="Clientes Únicos" 
          value={statsData.uniqueClients} 
          trend={`${statsData.recurrentClients} recorrentes hoje`} 
          icon={UserCheck} 
          color="#3498db" 
          loading={statsData.loading || salonLoading} 
        />
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