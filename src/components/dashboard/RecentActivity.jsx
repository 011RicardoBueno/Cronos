import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { CheckCircle2, MessageCircle, Loader2, XCircle, Clock } from 'lucide-react';
import moment from 'moment';

export default function RecentActivity() {
  const { professionals, loading: salonLoading } = useSalon();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRecentSlots = React.useCallback(async () => {
    if (!professionals?.length) {
      setLoading(false);
      return;
    }

    try {
      const now = moment().startOf('day').toISOString();
      const endOfDay = moment().endOf('day').toISOString();

      const { data, error } = await supabase
        .from('slots')
        .select(`id, start_time, client_name, client_phone, status, services (name), professionals (name)`)
        .in('professional_id', professionals.map(p => p.id))
        .neq('status', 'cancelled')
        .gte('start_time', now)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: true })
        .limit(8);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [professionals]);

  useEffect(() => {
    fetchRecentSlots();
  }, [professionals, fetchRecentSlots]);

  const getTimeBadge = (startTime) => {
    const diff = moment(startTime).diff(moment(), 'minutes');
    if (diff < 0 && diff > -30) return { label: 'Agora', className: 'text-red-500' };
    if (diff > 0 && diff <= 60) return { label: `Em ${diff} min`, className: 'text-brand-primary' };
    return null;
  };

  const updateStatus = async (slotId, newStatus) => {
    setUpdatingId(slotId);
    try {
      const { error } = await supabase
        .from('slots')
        .update({ status: newStatus })
        .eq('id', slotId);

      if (error) throw error;
      setActivities(prev => 
        newStatus === 'cancelled' 
          ? prev.filter(s => s.id !== slotId)
          : prev.map(s => s.id === slotId ? { ...s, status: newStatus } : s)
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || salonLoading) return <div className="p-5 text-center flex justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="grid gap-0">
      {activities.length > 0 ? (
        activities.map((slot) => {
          const badge = getTimeBadge(slot.start_time);
          return (
            <div key={slot.id} className={`flex items-center justify-between py-4 border-b border-brand-muted/5 last:border-0 ${slot.status === 'completed' ? 'opacity-60' : 'opacity-100'}`}>
              <div className="flex gap-3 items-center">
                <div className="text-center min-w-[60px]">
                  <div className="font-extrabold text-brand-text text-base">
                    {moment(slot.start_time).format('HH:mm')}
                  </div>
                  {badge && (
                    <span className={`text-[10px] font-bold uppercase ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="m-0 text-sm text-brand-text font-bold">
                    {slot.client_name || 'Particular'}
                  </h4>
                  <p className="m-0 text-xs text-brand-muted">
                    {slot.services?.name} • <span className="text-brand-primary">{slot.professionals?.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {slot.status !== 'completed' && (
                  <>
                    <button 
                      onClick={() => updateStatus(slot.id, 'cancelled')} 
                      className="bg-transparent border-none text-red-200 hover:text-red-500 cursor-pointer transition-colors p-1"
                    >
                      <XCircle size={20} />
                    </button>
                    <button
                      onClick={() => {
                        const clean = (slot.client_phone || '').replace(/\D/g, "");
                        window.open(`https://wa.me/${clean.length <= 11 ? '55'+clean : clean}?text=Olá!`, '_blank');
                      }}
                      className="bg-[#25D366] border-none rounded-full w-[30px] h-[30px] flex items-center justify-center text-white cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <MessageCircle size={14} />
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => updateStatus(slot.id, 'completed')}
                  disabled={updatingId === slot.id || slot.status === 'completed'}
                  className={`bg-transparent border-none cursor-pointer transition-colors p-1 ${slot.status === 'completed' ? 'text-brand-primary' : 'text-gray-300 hover:text-brand-primary'}`}
                >
                  {updatingId === slot.id ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={24} />}
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-10 text-brand-muted">Agenda livre para o resto do dia.</div>
      )}
    </div>
  );
}