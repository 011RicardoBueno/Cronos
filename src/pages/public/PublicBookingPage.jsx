import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, Info, Clock, Star, ShieldCheck } from 'lucide-react';
import { COLORS } from '../../constants/dashboard';
import SalonBooking from '../client/SalonBooking';
import moment from 'moment';

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSalon() {
      try {
        const { data, error } = await supabase
          .from('salons')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        setSalon(data);
        
        // Atualiza o título da página para o nome do salão
        document.title = `${data.name} | Agendamento Online`;
      } catch (err) {
        console.error("Erro ao carregar salão:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSalon();
  }, [slug]);

  // Lógica para verificar se está aberto agora
  const isOpen = () => {
    if (!salon?.opening_time || !salon?.closing_time) return null;
    const now = moment();
    const open = moment(salon.opening_time, 'HH:mm');
    const close = moment(salon.closing_time, 'HH:mm');
    return now.isBetween(open, close);
  };

  if (loading) return (
    <div style={styles.center}>
      <div className="animate-spin" style={styles.loader}></div>
      <p>Carregando vitrine...</p>
    </div>
  );

  if (!salon) return (
    <div style={styles.center}>
      <h2 style={{ color: COLORS.deepCharcoal }}>Página não encontrada</h2>
      <p>O link pode ter sido alterado ou o salão não está mais disponível.</p>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Banner de Branding */}
      <div style={styles.heroSection}>
        <div style={styles.overlay}></div>
        {salon.logo_url && (
          <img src={salon.logo_url} alt={salon.name} style={styles.salonLogo} />
        )}
      </div>

      <div style={styles.contentWrapper}>
        <header style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>{salon.name}</h1>
            <div style={styles.badgeRow}>
              <span style={{ 
                ...styles.statusBadge, 
                backgroundColor: isOpen() ? '#E8F5E9' : '#FFF1F0',
                color: isOpen() ? '#2E7D32' : '#F5222D'
              }}>
                {isOpen() ? 'Aberto agora' : 'Fechado'}
              </span>
              <span style={styles.verifiedBadge}>
                <ShieldCheck size={14} /> Oficial
              </span>
            </div>
          </div>

          <div style={styles.infoGrid}>
            <p style={styles.infoItem}><MapPin size={16} color={COLORS.sageGreen} /> {salon.address}</p>
            <p style={styles.infoItem}>
              <Clock size={16} color={COLORS.sageGreen} /> 
              {salon.opening_time?.slice(0,5)} às {salon.closing_time?.slice(0,5)}
            </p>
          </div>

          {salon.description && (
            <div style={styles.descriptionBox}>
               <Info size={16} color={COLORS.deepCharcoal} style={{ flexShrink: 0 }} />
               <p style={{ margin: 0 }}>{salon.description}</p>
            </div>
          )}
        </header>

        {/* Componente de Agendamento */}
        <div style={styles.bookingContainer}>
          <SalonBooking publicMode={true} salonIdFromSlug={salon.id} />
        </div>

        <footer style={styles.footer}>
          <p>Powered by <strong>Fluxo SaaS</strong></p>
        </footer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#F8F9FA' },
  heroSection: { 
    height: '180px', 
    backgroundColor: COLORS.deepCharcoal, 
    position: 'relative', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'flex-end',
    backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, #262626 25%, #262626 50%, #1a1a1a 50%, #1a1a1a 75%, #262626 75%, #262626 100%)',
    backgroundSize: '40px 40px'
  },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.4))' },
  salonLogo: { 
    width: '110px', 
    height: '110px', 
    borderRadius: '24px', 
    border: '4px solid white', 
    backgroundColor: 'white',
    objectFit: 'cover',
    marginBottom: '-40px',
    zIndex: 2,
    boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
  },
  contentWrapper: { maxWidth: '700px', margin: '0 auto', padding: '60px 20px 40px' },
  header: { textAlign: 'center', marginBottom: '30px' },
  headerTop: { marginBottom: '15px' },
  title: { fontSize: '2.2rem', fontWeight: '800', color: COLORS.deepCharcoal, margin: '0 0 10px 0', letterSpacing: '-0.5px' },
  badgeRow: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
  statusBadge: { padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  verifiedBadge: { backgroundColor: '#E3F2FD', color: '#1565C0', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginBottom: '20px' },
  infoItem: { margin: 0, color: '#555', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' },
  descriptionBox: { 
    backgroundColor: 'white', 
    padding: '15px 20px', 
    borderRadius: '16px', 
    fontSize: '0.9rem', 
    color: '#444', 
    display: 'flex', 
    alignItems: 'flex-start', 
    gap: '12px', 
    textAlign: 'left',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    border: '1px solid #eee'
  },
  bookingContainer: { backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' },
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '20px', textAlign: 'center' },
  loader: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: `4px solid ${COLORS.sageGreen}`, borderRadius: '50%' },
  footer: { marginTop: '40px', textAlign: 'center', color: '#bbb', fontSize: '12px' }
};