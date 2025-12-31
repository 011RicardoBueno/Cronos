import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import { CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import moment from 'moment';

export default function RecentActivity() {
  const { professionals, loading: salonLoading } = useSalon();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRecentSlots = async () => {
    if (!professionals || professionals.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const now = moment().toISOString();
      const endOfDay = moment().endOf('day').toISOString();

      const { data, error } = await supabase
        .from('slots')
        .select(`
          id,
          start_time,
          client_name,
          client_phone,
          status,
          services (name),
          professionals (name)
        `)
        .in('professional_id', professionals.map(p => p.id))
        .gte('start_time', now)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: true })
        .limit(6);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error("Erro ao buscar atividade recente:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentSlots();
  }, [professionals]);

  const handleWhatsApp = (slot) => {
    const phone = slot.client_phone;
    if (!phone) {
      alert("Telefone não cadastrado.");
      return;
    }
    const cleanNumber = phone.replace(/\D/g, "");
    const finalNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(`Olá ${slot.client_name}! Confirmamos seu horário às ${moment(slot.start_time).format('HH:mm')}.`);
    window.open(`https://wa.me/${finalNumber}?text=${message}`, '_blank');
  };

  const handleCompleteStatus = async (slotId, currentStatus) => {
    if (currentStatus === 'completed') return;
    
    setUpdatingId(slotId);
    try {
      const { error } = await supabase
        .from('slots')
        .update({ status: 'completed' })
        .eq('id', slotId);

      if (error) throw error;

      // Atualiza o estado local para refletir a mudança visualmente
      setActivities(prev => 
        prev.map(s => s.id === slotId ? { ...s, status: 'completed' } : s)
      );
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert("Não foi possível concluir o agendamento.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || salonLoading) return <p style={{ color: '#666' }}>A carregar atividade...</p>;

  return (
    <div style={{ display: 'grid', gap: '5px' }}>
      {activities.length > 0 ? (
        activities.map((slot) => (
          <div key={slot.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: `1px solid #f0f0f0`
          }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{
                backgroundColor: COLORS.offWhite,
                padding: '8px 10px',
                borderRadius: '8px',
                textAlign: 'center',
                minWidth: '55px',
                border: `1px solid #eee`
              }}>
                <span style={{ fontWeight: 'bold', color: COLORS.deepCharcoal, fontSize: '0.9rem' }}>
                  {moment(slot.start_time).format('HH:mm')}
                </span>
              </div>

              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: COLORS.deepCharcoal, fontWeight: '600' }}>
                  {slot.client_name || 'Cliente Particular'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                  {slot.services?.name} • <span style={{ color: COLORS.sageGreen }}>{slot.professionals?.name}</span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {slot.client_phone && (
                <button
                  onClick={() => handleWhatsApp(slot)}
                  style={{
                    backgroundColor: '#25D366',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <MessageCircle size={16} />
                </button>
              )}
              
              <button
                onClick={() => handleCompleteStatus(slot.id, slot.status)}
                disabled={updatingId === slot.id || slot.status === 'completed'}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: slot.status === 'completed' ? 'default' : 'pointer',
                  color: slot.status === 'completed' ? COLORS.sageGreen : '#ddd',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s'
                }}
              >
                {updatingId === slot.id ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={22} />
                )}
              </button>
            </div>
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
           <p style={{ color: '#999', margin: 0, fontSize: '0.9rem' }}>Nenhum agendamento pendente.</p>
        </div>
      )}
    </div>
  );
}