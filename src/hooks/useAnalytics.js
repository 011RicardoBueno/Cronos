import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import moment from 'moment';

export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState({
    professionalPerformance: [],
    atRiskClients: [],
    recentExpenses: [],
    stats: { 
      totalRevenue: 0, 
      totalAppointments: 0, 
      totalExpenses: 0, 
      netProfit: 0 
    }
  });

  const fetchAnalytics = useCallback(async (salonId, professionals, days = 30) => {
    if (!salonId || !professionals?.length) return;

    setLoading(true);
    try {
      const startDate = moment().subtract(days, 'days').startOf('day').toISOString();

      // 1. Busca simultânea: Transações, Slots e agora DESPESAS
      const [transRes, slotsRes, expensesRes] = await Promise.all([
        supabase
          .from('finance_transactions')
          .select('*')
          .eq('salon_id', salonId)
          .gte('created_at', startDate),
        supabase
          .from('slots')
          .select('id, client_id, client_name, professional_id, start_time, status')
          .in('professional_id', professionals.map(p => p.id))
          .gte('start_time', startDate),
        supabase
          .from('expenses')
          .select('*')
          .eq('salon_id', salonId)
          .gte('date', startDate)
      ]);

      const transactions = transRes.data || [];
      const slots = slotsRes.data || [];
      const expenses = expensesRes.data || [];

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

      // --- LÓGICA 2: CLIENTES EM RISCO (CHURN) ---
      const activeClientsIds = new Set(slots.map(s => s.client_id));
      const pastStartDate = moment().subtract(90, 'days').toISOString();
      const pastEndDate = moment().subtract(31, 'days').toISOString();
      
      const { data: pastSlots } = await supabase
        .from('slots')
        .select('client_id, client_name, start_time')
        .in('professional_id', professionals.map(p => p.id))
        .gte('start_time', pastStartDate)
        .lte('start_time', pastEndDate)
        .order('start_time', { ascending: false });

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

      // --- LÓGICA 3: CÁLCULOS FINANCEIROS TOTAIS ---
      const totalRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);
      const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
      
      // O que o salão paga de comissão (custo variável de mão de obra)
      const totalCommissionOut = transactions.reduce((acc, t) => acc + (t.professional_commission || 0), 0);

      // Lucro Líquido = Faturamento - Comissões Pagas - Despesas (Aluguel, Luz, etc)
      const netProfit = totalRevenue - totalCommissionOut - totalExpenses;

      setInsights({
        professionalPerformance: performance,
        atRiskClients: atRisk.slice(0, 10),
        recentExpenses: expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
        stats: {
          totalRevenue,
          totalAppointments: slots.filter(s => s.status === 'completed').length,
          totalExpenses,
          netProfit
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