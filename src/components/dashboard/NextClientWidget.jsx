import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { Clock, ArrowRight } from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

export default function NextClientWidget() {
  const { professionals, loading: salonLoading } = useSalon();
  const [nextSlot, setNextSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!salonLoading && professionals?.length > 0) {
      fetchNextClient();
    } else if (!salonLoading && (!professionals || professionals.length === 0)) {
      setLoading(false);
    }
  }, [professionals, salonLoading]);

  const fetchNextClient = async () => {
    try {
      const now = moment().toISOString();
      const endOfDay = moment().endOf('day').toISOString();

      const { data, error } = await supabase
        .from('slots')
        .select(`
          id, start_time, client_name, 
          services (name), 
          professionals (name)
        `)
        .in('professional_id', professionals.map(p => p.id))
        .neq('status', 'cancelled')
        .gte('start_time', now)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setNextSlot(data);
    } catch (error) {
      console.error('Error fetching next client:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !nextSlot) return null;

  const startTime = moment(nextSlot.start_time);
  const timeDiff = startTime.diff(moment(), 'minutes');
  
  let timeDisplay;
  let timeLabel;
  
  if (timeDiff <= 0) {
    timeDisplay = 'Agora';
    timeLabel = 'Atendimento atual';
  } else if (timeDiff < 60) {
    timeDisplay = `${timeDiff} min`;
    timeLabel = 'Para o início';
  } else {
    timeDisplay = startTime.format('HH:mm');
    timeLabel = 'Horário agendado';
  }

  return (
    <div className="bg-brand-primary text-white rounded-3xl p-6 mb-8 shadow-xl shadow-brand-primary/20 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
            <Clock size={32} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Próximo Cliente</span>
            </div>
            <h3 className="text-2xl font-black text-white leading-none mb-1">{nextSlot.client_name || 'Cliente sem nome'}</h3>
            <p className="text-white/80 text-sm font-medium flex items-center gap-2">
              {nextSlot.services?.name} 
              <span className="w-1 h-1 bg-white/50 rounded-full" /> 
              {nextSlot.professionals?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0 mt-2 md:mt-0">
          <div className="text-right">
            <p className="text-xs text-white/60 font-bold uppercase">{timeLabel}</p>
            <p className="text-3xl font-black text-white leading-none">{timeDisplay}</p>
          </div>
          
          <button 
            onClick={() => navigate('/agenda')}
            className="bg-white text-brand-primary px-5 py-3 rounded-xl font-bold text-sm hover:bg-brand-surface transition-colors shadow-lg flex items-center gap-2"
          >
            Ver Agenda <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}