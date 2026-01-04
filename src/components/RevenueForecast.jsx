import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import moment from 'moment';
import { TrendingUp, Calendar, Loader2, BarChart } from 'lucide-react';

export default function RevenueForecast({ salonId }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    currentRevenue: 0,
    dailyAverage: 0,
    forecast: 0,
    daysRemaining: 0
  });

  useEffect(() => {
    if (salonId) fetchForecast();
  }, [salonId]);

  const fetchForecast = async () => {
    try {
      const startOfMonth = moment().startOf('month');
      const today = moment();
      const daysInMonth = moment().daysInMonth();
      const currentDay = today.date();
      
      // Buscar receitas do mês atual (MTD)
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('amount, type')
        .eq('salon_id', salonId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', today.endOf('day').toISOString());

      if (error) throw error;

      const currentRevenue = data.reduce((acc, curr) => {
        const isExpense = curr.type === 'expense' || curr.amount < 0;
        return isExpense ? acc : acc + Math.abs(curr.amount);
      }, 0);

      // Calcular média e previsão
      const dailyAverage = currentRevenue / Math.max(1, currentDay);
      const daysRemaining = daysInMonth - currentDay;
      const forecast = currentRevenue + (dailyAverage * daysRemaining);

      setMetrics({ currentRevenue, dailyAverage, forecast, daysRemaining });
    } catch (error) {
      console.error('Erro ao calcular previsão:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10 flex items-center justify-center h-full"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10 flex flex-col justify-between h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 text-brand-primary"><BarChart size={80} /></div>
      
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary"><TrendingUp size={20} /></div>
        <h3 className="font-bold text-brand-text text-sm uppercase tracking-wider">Previsão de Fechamento</h3>
      </div>

      <div className="relative z-10">
        <div className="mb-4">
          <p className="text-xs text-brand-muted mb-1">Estimativa para o fim do mês</p>
          <h3 className="text-3xl font-black text-brand-text">
            {metrics.forecast.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-muted/10">
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase">Média Diária</p>
            <p className="font-bold text-brand-text">{metrics.dailyAverage.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-brand-muted uppercase">Faltam</p>
            <p className="font-bold text-brand-text">{metrics.daysRemaining} dias</p>
          </div>
        </div>
      </div>
    </div>
  );
}