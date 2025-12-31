import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';
import { Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/pt-br';
import ClientHeader from '../../components/ui/ClientHeader';

moment.locale('pt-br');

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setLoading(false);
        return;
      }

      // A busca agora depende da FK que criamos no SQL acima
      const { data, error } = await supabase
        .from('slots')
        .select(`
          *,
          salons (name, address),
          services (name, price)
        `)
        .eq('client_id', user.id)
        .order('start_time', { ascending: false }); // Mostra os mais recentes primeiro

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error("Erro ao buscar agendamentos:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const upcoming = appointments.filter(a => moment(a.start_time).isAfter(moment()));
  const history = appointments.filter(a => moment(a.start_time).isBefore(moment()));

  if (loading) return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh' }}>
      <ClientHeader />
      <div style={styles.center}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 10px', color: COLORS.sageGreen }} />
        <p>Carregando seus agendamentos...</p>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh' }}>
      <ClientHeader />
      <div style={styles.container}>
        <h2 style={styles.title}>Meus Agendamentos</h2>

        {appointments.length === 0 ? (
          <div style={styles.emptyState}>
            <AlertCircle size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
            <p style={{ fontWeight: '500' }}>Você ainda não possui agendamentos.</p>
            <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>Encontre um salão e agende agora mesmo!</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section style={{ marginBottom: '32px' }}>
                <h3 style={styles.sectionTitle}>Próximos</h3>
                {upcoming.map(app => (
                  <AppointmentCard key={app.id} app={app} isUpcoming />
                ))}
              </section>
            )}

            {history.length > 0 && (
              <section>
                <h3 style={styles.sectionTitle}>Histórico</h3>
                {history.map(app => (
                  <AppointmentCard key={app.id} app={app} isUpcoming={false} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ app, isUpcoming }) {
  const price = app.services?.price || 0;

  return (
    <div style={{...styles.card, borderLeft: isUpcoming ? `4px solid ${COLORS.sageGreen}` : '4px solid #D1D5DB'}}>
      <div style={styles.cardHeader}>
        <div>
          <span style={styles.salonName}>{app.salons?.name || 'Salão não identificado'}</span>
          <p style={styles.salonAddress}>{app.salons?.address}</p>
        </div>
        <span style={{
          ...styles.statusBadge, 
          backgroundColor: isUpcoming ? '#E8F5E9' : '#F3F4F6',
          color: isUpcoming ? '#1B5E20' : '#4B5563'
        }}>
          {isUpcoming ? 'Confirmado' : 'Realizado'}
        </span>
      </div>
      
      <div style={styles.serviceRow}>
        <div style={styles.infoItem}>
          <Calendar size={14} color="#6B7280" />
          <span>{moment(app.start_time).format('DD [de] MMMM')}</span>
        </div>
        <div style={styles.infoItem}>
          <Clock size={14} color="#6B7280" />
          <span>{moment(app.start_time).format('HH:mm')}</span>
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.serviceName}>{app.services?.name || 'Serviço'}</div>
        <div style={styles.price}>R$ {Number(price).toFixed(2)}</div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '24px 20px 60px' },
  title: { fontSize: '1.75rem', fontWeight: '800', color: COLORS.deepCharcoal, marginBottom: '24px' },
  sectionTitle: { fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '700' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#666' },
  emptyState: { textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #E5E7EB' },
  card: { backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  salonName: { fontSize: '16px', fontWeight: '700', color: COLORS.deepCharcoal, display: 'block' },
  salonAddress: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
  statusBadge: { fontSize: '11px', padding: '4px 10px', borderRadius: '99px', fontWeight: '700' },
  serviceRow: { display: 'flex', gap: '20px', marginBottom: '16px', color: '#4B5563', fontSize: '14px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '6px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '16px' },
  serviceName: { color: COLORS.deepCharcoal, fontWeight: '600', fontSize: '15px' },
  price: { fontWeight: '700', color: COLORS.sageGreen, fontSize: '16px' }
};