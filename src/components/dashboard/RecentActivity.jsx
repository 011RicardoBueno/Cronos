import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import { Clock, User, CheckCircle2 } from 'lucide-react';
import moment from 'moment';

export default function RecentActivity() {
  const { professionals, loading: salonLoading } = useSalon();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentSlots = async () => {
      if (!professionals || professionals.length === 0) return;

      try {
        const today = moment().startOf('day').toISOString();
        const next24h = moment().endOf('day').toISOString();

        const { data, error } = await supabase
          .from('slots')
          .select(`
            id,
            start_time,
            client_name,
            services (name),
            professionals (name)
          `)
          .in('professional_id', professionals.map(p => p.id))
          .gte('start_time', today)
          .lte('start_time', next24h)
          .order('start_time', { ascending: true })
          .limit(5); // Mostra apenas os 5 mais próximos

        if (error) throw error;
        setActivities(data || []);
      } catch (err) {
        console.error("Erro ao buscar atividade recente:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSlots();
  }, [professionals]);

  if (loading || salonLoading) return <p style={{ color: '#666' }}>A carregar atividade...</p>;

  return (
    <div style={{ display: 'grid', gap: '15px' }}>
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
              {/* Horário */}
              <div style={{
                backgroundColor: COLORS.offWhite,
                padding: '8px 12px',
                borderRadius: '8px',
                textAlign: 'center',
                minWidth: '60px'
              }}>
                <span style={{ fontWeight: 'bold', color: COLORS.deepCharcoal, display: 'block' }}>
                  {moment(slot.start_time).format('HH:mm')}
                </span>
              </div>

              {/* Detalhes */}
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', color: COLORS.deepCharcoal }}>
                  {slot.client_name || 'Cliente Particular'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                  {slot.services?.name} • <span style={{ color: COLORS.sageGreen }}>{slot.professionals?.name}</span>
                </p>
              </div>
            </div>

            <div style={{ color: COLORS.warmSand }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
           <p style={{ color: '#999', margin: 0 }}>Nenhum agendamento para o resto do dia.</p>
        </div>
      )}
    </div>
  );
}