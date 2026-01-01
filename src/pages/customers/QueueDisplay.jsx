import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import { Clock, Scissors, Star } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import moment from 'moment';
import 'moment/locale/pt-br';

export default function QueueDisplay() {
  const { professionals, salon } = useSalon();
  const [queue, setQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(moment().format('HH:mm:ss'));

  const bookingUrl = salon?.slug 
    ? `https://fluxo.com/p/${salon.slug}` 
    : "https://fluxo.com";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment().format('HH:mm:ss')), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!professionals?.length) return;

    const fetchQueue = async () => {
      const startOfDay = moment().startOf('day').toISOString();
      const { data } = await supabase
        .from('slots')
        .select(`id, start_time, client_name, status, services(name), professionals(name)`)
        .in('professional_id', professionals.map(p => p.id))
        .neq('status', 'cancelled')
        .neq('status', 'completed')
        .gte('start_time', startOfDay)
        .lte('start_time', moment().endOf('day').toISOString())
        .order('start_time', { ascending: true });

      setQueue(data || []);
    };

    fetchQueue();

    const channel = supabase
      .channel('queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => fetchQueue())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [professionals]);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
      `}</style>

      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          {salon?.logo_url && (
            <img src={salon.logo_url} alt="Logo" style={styles.salonLogo} />
          )}
          <div>
            <h1 style={styles.salonName}>{salon?.name || 'Carregando...'}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: COLORS.sageGreen }}>
              <Star size={18} fill={COLORS.sageGreen} />
              <span style={styles.tagline}>Painel de Atendimento em Tempo Real</span>
            </div>
          </div>
        </div>
        <div style={styles.clockBox}>
          <Clock size={32} color={COLORS.sageGreen} />
          <span style={styles.clockText}>{currentTime}</span>
        </div>
      </header>

      <main style={styles.main}>
        {queue.length > 0 ? (
          <div style={styles.grid}>
            {queue.slice(0, 5).map((item, index) => (
              <div key={item.id} style={{
                ...styles.card,
                borderLeft: `15px solid ${index === 0 ? COLORS.sageGreen : '#ddd'}`,
                animation: `fadeIn ${0.3 + index * 0.1}s ease-out forwards`,
                backgroundColor: index === 0 ? '#f0fdf4' : 'white',
                transform: index === 0 ? 'scale(1.02)' : 'scale(1)'
              }}>
                <div style={styles.timeBox}>
                  <span style={styles.timeText}>{moment(item.start_time).format('HH:mm')}</span>
                  {index === 0 && <span style={styles.nowBadge}>A SEGUIR</span>}
                </div>
                
                <div style={styles.infoBox}>
                  <h2 style={styles.clientName}>{item.client_name || 'Próximo Cliente'}</h2>
                  <p style={styles.serviceText}>
                    <Scissors size={28} style={{ marginRight: 15 }} color={COLORS.sageGreen} />
                    {item.services?.name} • <span style={{ fontWeight: '800' }}>{item.professionals?.name}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyContainer}>
            <div style={styles.qrHeroSection}>
              <h2 style={styles.emptyTitle}>Sua vez está chegando!</h2>
              <p style={styles.emptySubtitle}>Escaneie para agendar seu próximo horário</p>
              
              <div style={styles.qrMainWrapper}>
                <QRCodeSVG 
                  value={bookingUrl} 
                  size={320}
                  level={"H"}
                  includeMargin={true}
                  imageSettings={salon?.logo_url ? {
                    src: salon.logo_url,
                    height: 60,
                    width: 60,
                    excavate: true,
                  } : undefined}
                />
              </div>
              <p style={styles.urlDisplay}>{bookingUrl.replace('https://', '')}</p>
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px' }}>
          <span>Agendamentos Online: <strong>{bookingUrl.replace('https://', '')}</strong></span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>Siga-nos no Instagram</span>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F3F4F6', padding: '50px', fontFamily: 'Inter, sans-serif', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px', backgroundColor: 'white', padding: '30px 40px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  salonLogo: { width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover' },
  salonName: { fontSize: '42px', fontWeight: '900', color: COLORS.deepCharcoal, margin: 0, letterSpacing: '-1.5px' },
  tagline: { fontSize: '18px', fontWeight: '600', margin: 0 },
  clockBox: { display: 'flex', alignItems: 'center', gap: '20px', padding: '15px 35px', borderRadius: '25px', backgroundColor: '#f8fafc' },
  clockText: { fontSize: '44px', fontWeight: '800', color: COLORS.deepCharcoal, fontVariantNumeric: 'tabular-nums' },
  main: { maxWidth: '1200px', margin: '0 auto' },
  grid: { display: 'grid', gap: '20px' },
  card: { display: 'flex', alignItems: 'center', padding: '40px', borderRadius: '35px', boxShadow: '0 15px 40px rgba(0,0,0,0.04)', opacity: 0 },
  timeBox: { minWidth: '180px', textAlign: 'center' },
  timeText: { fontSize: '64px', fontWeight: '900', color: COLORS.deepCharcoal, lineHeight: 1 },
  nowBadge: { backgroundColor: COLORS.sageGreen, color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', display: 'inline-block', marginTop: '10px' },
  infoBox: { marginLeft: '60px' },
  clientName: { fontSize: '54px', fontWeight: '800', color: COLORS.deepCharcoal, margin: '0 0 10px 0' },
  serviceText: { fontSize: '32px', color: '#666', display: 'flex', alignItems: 'center', margin: 0 },
  emptyContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' },
  qrHeroSection: { textAlign: 'center', animation: 'fadeIn 1s ease-out' },
  emptyTitle: { fontSize: '56px', fontWeight: '900', color: COLORS.deepCharcoal, margin: 0 },
  emptySubtitle: { fontSize: '24px', color: '#666', marginBottom: '40px' },
  qrMainWrapper: { padding: '30px', backgroundColor: 'white', borderRadius: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.1)', display: 'inline-block', animation: 'pulse 3s infinite' },
  urlDisplay: { marginTop: '30px', fontSize: '28px', color: COLORS.sageGreen, fontWeight: '800' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '35px', backgroundColor: COLORS.deepCharcoal, color: 'white', fontSize: '20px', fontWeight: '500' }
};