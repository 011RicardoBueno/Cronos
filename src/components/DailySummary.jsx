import React, { useMemo } from 'react';
import { Calendar, DollarSign } from 'lucide-react';

export default function DailySummary({ slots, viewMode }) {
  const stats = useMemo(() => {
    const activeSlots = slots.filter(s => s.status !== 'cancelled' && s.status !== 'blocked');
    const total = activeSlots.length;
    const revenue = activeSlots.reduce((acc, s) => acc + (Number(s.services?.price) || 0), 0);
    
    return { total, revenue };
  }, [slots]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-in fade-in slide-in-from-top-4">
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-muted/20 flex items-center gap-4 shadow-sm">
        <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
          <Calendar size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-brand-muted uppercase">{viewMode === 'week' ? 'Agendamentos na Semana' : 'Agendamentos no Dia'}</p>
          <h3 className="text-xl font-black text-brand-text">{stats.total}</h3>
        </div>
      </div>
      
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-muted/20 flex items-center gap-4 shadow-sm">
        <div className="p-3 rounded-xl bg-green-100 text-green-600">
          <DollarSign size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-brand-muted uppercase">{viewMode === 'week' ? 'Previsto na Semana' : 'Previsto no Dia'}</p>
          <h3 className="text-xl font-black text-brand-text">
            {stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
        </div>
      </div>
    </div>
  );
}