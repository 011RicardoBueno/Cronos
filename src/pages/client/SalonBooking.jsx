import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';

const SalonBooking = () => {
  const { id } = useParams(); // Pega o ID do salão da URL
  const navigate = useNavigate();
  
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalonDetails = async () => {
      try {
        setLoading(true);
        
        // 1. Busca dados do salão
        const { data: salonData } = await supabase
          .from('salons')
          .select('*')
          .eq('id', id)
          .single();

        // 2. Busca serviços deste salão
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('salon_id', id);

        setSalon(salonData);
        setServices(servicesData || []);
      } catch (err) {
        console.error('Erro ao carregar detalhes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonDetails();
  }, [id]);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando serviços...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.offWhite, padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Botão Voltar */}
        <button 
          onClick={() => navigate(-1)}
          style={{ marginBottom: '20px', background: 'none', border: 'none', color: COLORS.deepCharcoal, cursor: 'pointer' }}
        >
          ← Voltar para busca
        </button>

        {/* Info do Salão */}
        <div style={{ backgroundColor: COLORS.white, padding: '30px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h1 style={{ color: COLORS.deepCharcoal, margin: '0 0 10px 0' }}>{salon?.name}</h1>
          <p style={{ color: '#666', margin: 0 }}>📍 {salon?.address}</p>
        </div>

        <h2 style={{ color: COLORS.deepCharcoal, marginBottom: '20px' }}>Serviços Disponíveis</h2>

        {/* Listagem de Serviços */}
        <div style={{ display: 'grid', gap: '15px' }}>
          {services.length > 0 ? (
            services.map(service => (
              <div 
                key={service.id}
                style={{
                  backgroundColor: COLORS.white,
                  padding: '20px',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: `1px solid ${COLORS.warmSand}`
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: COLORS.deepCharcoal }}>{service.name}</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>{service.duration} min</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: COLORS.sageGreen }}>
                    R$ {Number(service.price).toFixed(2)}
                  </p>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: COLORS.deepCharcoal,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}>
                    Escolher
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>Este salão ainda não cadastrou serviços.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalonBooking;