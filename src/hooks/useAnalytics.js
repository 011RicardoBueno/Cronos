import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import moment from 'moment';

export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState({
    professionalPerformance: [],
    atRiskClients: [],
    stats: { totalRevenue: 0, totalAppointments: 0 }
  });

  const fetchAnalytics = useCallback(async (salonId, professionals, days = 30) => {
    if (!salonId || !professionals?.length) return;

    setLoading(true);
    try {
      const startDate = moment().subtract(days, 'days').startOf('day').toISOString();

      // 1. Buscar simultaneamente transações e slots
      const [transRes, slotsRes] = await Promise.all([
        supabase
          .from('finance_transactions')
          .select('*')
          .eq('salon_id', salonId)
          .gte('created_at', startDate),
        supabase
          .from('slots')
          .select('id, client_id, client_name, professional_id, start_time, status')
          .in('professional_id', professionals.map(p => p.id))
          .gte('start_time', startDate)
      ]);

      const transactions = transRes.data || [];
      const slots = slotsRes.data || [];

      // --- LÓGICA 1: PERFORMANCE POR PROFISSIONAL ---
      const performance = professionals.map(pro => {
        const proTrans = transactions.filter(t => t.professional_id === pro.id);
        const proSlots = slots.filter(s => s.professional_id === pro.id && s.status === 'completed');
        
        const revenue = proTrans.reduce((acc, t) => acc + t.amount, 0);
        return {
          id: pro.id,
          name: pro.name,
          revenue: revenue,
          appointments: proSlots.length,
          avgTicket: proSlots.length > 0 ? revenue / proSlots.length : 0
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // --- LÓGICA 2: CLIENTES EM RISCO (CHURN - Simples) ---
      // Pegamos todos os slots recentes para saber quem VEIO
      const activeClientsIds = new Set(slots.map(s => s.client_id));
      
      // Buscamos slots de um período anterior (ex: entre 30 e 90 dias atrás)
      const pastStartDate = moment().subtract(90, 'days').toISOString();
      const pastEndDate = moment().subtract(31, 'days').toISOString();
      
      const { data: pastSlots } = await supabase
        .from('slots')
        .select('client_id, client_name, start_time')
        .in('professional_id', professionals.map(p => p.id))
        .gte('start_time', pastStartDate)
        .lte('start_time', pastEndDate)
        .order('start_time', { ascending: false });

      // Filtramos quem veio no passado mas NÃO veio nos últimos 30 dias
      const atRisk = [];
      const processedIds = new Set();

      pastSlots?.forEach(slot => {
        if (!activeClientsIds.has(slot.client_id) && !processedIds.has(slot.client_id)) {
          atRisk.push({
            id: slot.client_id,
            name: slot.client_name,
            lastVisit: slot.start_time,
            daysAway: moment().diff(moment(slot.start_time), 'days')
          });
          processedIds.add(slot.client_id);
        }
      });

      setInsights({
        professionalPerformance: performance,
        atRiskClients: atRisk.slice(0, 10), // Top 10 mais críticos
        stats: {
          totalRevenue: transactions.reduce((acc, t) => acc + t.amount, 0),
          totalAppointments: slots.filter(s => s.status === 'completed').length
        }
      });

    } catch (error) {
      console.error("Erro no useAnalytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { insights, loading, fetchAnalytics };
}