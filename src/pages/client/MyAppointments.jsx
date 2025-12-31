import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('slots')
        .select(`
          *,
          salons (name, address),
          services (name, price)
        `)
        .eq('client_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error("Erro ao buscar agendamentos:", err);
    } finally {
      setLoading(false);
    }
  };

  const upcoming = appointments.filter(a => moment(a.start_time).isAfter(moment()));
  const history = appointments.filter(a => moment(a.start_time).isBefore(moment()));

  if (loading) return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh' }}>
      <ClientHeader />
      <div style={styles.center}>Carregando seus agendamentos...</div>
    </div>
  );

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh' }}>
      <ClientHeader />
      <div style={styles.container}>
        <h2 style={styles.title}>Meus Agendamentos</h2>

        {appointments.length === 0 ? (
          <div style={styles.emptyState}>
            <AlertCircle size={48} color="#ccc" />
            <p>Você ainda não possui agendamentos.</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <h3 style={styles.sectionTitle}>Próximos</h3>
                {upcoming.map(app => (
                  <AppointmentCard key={app.id} app={app} isUpcoming />
                ))}
              </section>
            )}

            {history.length > 0 && (
              <section style={{ marginTop: '30px' }}>
                <h3 style={styles.sectionTitle}>Histórico</h3>
                {history.map(app => (
                  <AppointmentCard key={app.id} app={app} />
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
  return (
    <div style={{...styles.card, opacity: isUpcoming ? 1 : 0.7}}>
      <div style={styles.cardHeader}>
        <span style={styles.salonName}>{app.salons?.name}</span>
        <span style={{
          ...styles.statusBadge, 
          backgroundColor: isUpcoming ? '#e8f5e9' : '#f5f5f5',
          color: isUpcoming ? '#2e7d32' : '#666'
        }}>
          {isUpcoming ? 'Confirmado' : 'Realizado'}
        </span>
      </div>
      
      <div style={styles.serviceRow}>
        <div style={styles.infoItem}>
          <Calendar size={16} />
          <span>{moment(app.start_time).format('DD [de] MMMM')}</span>
        </div>
        <div style={styles.infoItem}>
          <Clock size={16} />
          <span>{moment(app.start_time).format('HH:mm')}</span>
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.serviceName}>{app.services?.name}</div>
        <div style={styles.price}>R$ {Number(app.services?.price || 0).toFixed(2)}</div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '0 20px 40px' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.deepCharcoal, marginBottom: '25px' },
  sectionTitle: { fontSize: '0.8rem', color: '#888', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' },
  center: { textAlign: 'center', padding: '50px', color: '#666' },
  emptyState: { textAlign: 'center', padding: '50px', color: '#999', backgroundColor: 'white', borderRadius: '20px', border: '1px dashed #ccc' },
  card: { backgroundColor: 'white', borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #eee' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  salonName: { fontWeight: 'bold', color: COLORS.deepCharcoal },
  statusBadge: { fontSize: '0.7rem', padding: '4px 8px', borderRadius: '20px', fontWeight: 'bold' },
  serviceRow: { display: 'flex', gap: '15px', marginBottom: '12px', color: '#666', fontSize: '0.9rem' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '5px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f5f5f5', paddingTop: '12px' },
  serviceName: { color: COLORS.deepCharcoal, fontWeight: '500' },
  price: { fontWeight: 'bold', color: COLORS.sageGreen }
};