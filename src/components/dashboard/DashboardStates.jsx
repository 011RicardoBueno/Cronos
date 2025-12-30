import React, { useState, useEffect } from 'react';
import { CalendarCheck, Users, DollarSign, TrendingUp } from 'lucide-react';
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
    <div>
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
  const { professionals } = useSalon();
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTodayStats() {
      if (!professionals || professionals.length === 0) return;

      try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString();
        const endOfDay = new Date(today.setHours(23,59,59,999)).toISOString();

        const { count, error } = await supabase
          .from('slots')
          .select('*', { count: 'exact', head: true })
          .in('professional_id', professionals.map(p => p.id))
          .gte('start_time', startOfDay)
          .lte('start_time', endOfDay);

        if (error) throw error;
        setTodayCount(count || 0);
      } catch (err) {
        console.error("Erro ao procurar métricas:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTodayStats();
  }, [professionals]);

  const stats = [
    {
      label: "Agendamentos Hoje",
      value: todayCount.toString(),
      icon: CalendarCheck,
      trend: "Dados em tempo real",
      color: COLORS.sageGreen,
      loading: loading
    },
    {
      label: "Novos Clientes",
      value: "8", // Futuramente: buscar count de 'clients' criado_em hoje
      icon: Users,
      trend: "+12%",
      color: COLORS.deepCharcoal
    },
    {
      label: "Receita Prevista",
      value: "R$ ---", // Futuramente: sum(services.price)
      icon: DollarSign,
      trend: "Pendente",
      color: "#2D6A4F"
    },
    {
      label: "Ocupação",
      value: "78%",
      icon: TrendingUp,
      trend: "Média",
      color: COLORS.warmBeige
    }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
      gap: '20px' 
    }}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}