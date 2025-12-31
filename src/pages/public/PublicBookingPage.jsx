import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, CheckCircle2, Info, ArrowLeft } from 'lucide-react';
import { COLORS } from '../../constants/dashboard';
import SalonBooking from '../client/SalonBooking'; // Reutilizamos a lógica robusta

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
      } catch (err) {
        console.error("Erro ao carregar salão:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSalon();
  }, [slug]);

  if (loading) return <div style={styles.center}>Carregando vitrine...</div>;
  if (!salon) return <div style={styles.center}>Salão não encontrado ou link expirado.</div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>{salon.name}</h1>
        <p style={styles.address}><MapPin size={14} /> {salon.address}</p>
        {salon.description && (
          <div style={styles.description}>
             <Info size={14} /> {salon.description}
          </div>
        )}
      </header>

      {/* Renderiza o componente de agendamento passando o ID do salão carregado via Slug */}
      <SalonBooking publicMode={true} salonIdFromSlug={salon.id} />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: COLORS.offWhite, padding: '20px' },
  center: { padding: '100px 20px', textAlign: 'center', color: '#666' },
  header: { textAlign: 'center', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' },
  title: { fontSize: '1.8rem', color: COLORS.deepCharcoal, margin: '0 0 8px 0' },
  address: { color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
  description: { marginTop: '15px', padding: '10px', backgroundColor: `${COLORS.warmSand}30`, borderRadius: '10px', fontSize: '0.85rem', color: COLORS.deepCharcoal, display: 'inline-flex', alignItems: 'center', gap: '8px' }
};