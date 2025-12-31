import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import { CheckCircle2, MessageCircle, Loader2, XCircle, Clock } from 'lucide-react';
import moment from 'moment';

export default function RecentActivity() {
  const { professionals, loading: salonLoading } = useSalon();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRecentSlots = async () => {
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
  };

  useEffect(() => {
    fetchRecentSlots();
  }, [professionals]);

  const getTimeBadge = (startTime) => {
    const diff = moment(startTime).diff(moment(), 'minutes');
    if (diff < 0 && diff > -30) return { label: 'Agora', color: '#ef4444' };
    if (diff > 0 && diff <= 60) return { label: `Em ${diff} min`, color: COLORS.sageGreen };
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
      alert("Erro ao atualizar status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || salonLoading) return <div style={{ padding: '20px', textAlign: 'center' }}><Loader2 className="animate-spin" /></div>;

  return (
    <div style={{ display: 'grid', gap: '0' }}>
      {activities.length > 0 ? (
        activities.map((slot) => {
          const badge = getTimeBadge(slot.start_time);
          return (
            <div key={slot.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderBottom: `1px solid #f8f8f8`,
              opacity: slot.status === 'completed' ? 0.6 : 1
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                  <div style={{ fontWeight: '800', color: COLORS.deepCharcoal, fontSize: '1rem' }}>
                    {moment(slot.start_time).format('HH:mm')}
                  </div>
                  {badge && (
                    <span style={{ fontSize: '10px', color: badge.color, fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {badge.label}
                    </span>
                  )}
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: COLORS.deepCharcoal, fontWeight: '700' }}>
                    {slot.client_name || 'Particular'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>
                    {slot.services?.name} • <span style={{ color: COLORS.sageGreen }}>{slot.professionals?.name}</span>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {slot.status !== 'completed' && (
                  <>
                    <button onClick={() => updateStatus(slot.id, 'cancelled')} style={{ background: 'none', border: 'none', color: '#ffcfcf', cursor: 'pointer' }}>
                      <XCircle size={20} />
                    </button>
                    <button
                      onClick={() => {
                        const clean = (slot.client_phone || '').replace(/\D/g, "");
                        window.open(`https://wa.me/${clean.length <= 11 ? '55'+clean : clean}?text=Olá!`, '_blank');
                      }}
                      style={{ backgroundColor: '#25D366', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                    >
                      <MessageCircle size={14} />
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => updateStatus(slot.id, 'completed')}
                  disabled={updatingId === slot.id || slot.status === 'completed'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: slot.status === 'completed' ? COLORS.sageGreen : '#e0e0e0' }}
                >
                  {updatingId === slot.id ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={24} />}
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>Agenda livre para o resto do dia.</div>
      )}
    </div>
  );
}