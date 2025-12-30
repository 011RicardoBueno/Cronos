import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Clock, CheckCircle, MapPin, Phone } from 'lucide-react';
import { COLORS } from '../../constants/dashboard';

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Serviço, 2: Data/Hora, 3: Identificação

  const [bookingData, setBookingData] = useState({
    service: null,
    date: '',
    time: '',
    clientName: '',
    clientPhone: ''
  });

  useEffect(() => {
    async function loadPublicData() {
      try {
        // 1. Procura o salão pela slug
        const { data: salonData, error: sError } = await supabase
          .from('salons')
          .select('*')
          .eq('slug', slug)
          .single();

        if (sError) throw sError;
        setSalon(salonData);

        // 2. Busca os serviços deste salão
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('salon_id', salonData.id);
        
        setServices(servicesData || []);
      } catch (err) {
        console.error("Erro ao carregar página pública:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPublicData();
  }, [slug]);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>A carregar...</div>;
  if (!salon) return <div style={{ padding: '50px', textAlign: 'center' }}>Salão não encontrado.</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#f9f9f9', minHeight: '100vh', padding: '20px' }}>
      {/* Header do Salão */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: COLORS.deepCharcoal, marginBottom: '5px' }}>{salon.name}</h1>
        <div style={{ fontSize: '0.9rem', color: '#666', display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {salon.address || 'Ver morada'}</span>
        </div>
      </header>

      {/* Passo 1: Escolha de Serviço */}
      {step === 1 && (
        <div>
          <h3 style={{ marginBottom: '15px' }}>Escolha o serviço:</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {services.map(s => (
              <button 
                key={s.id}
                onClick={() => { setBookingData({...bookingData, service: s}); setStep(2); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '15px', borderRadius: '12px', border: '1px solid #ddd',
                  backgroundColor: 'white', textAlign: 'left', cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{s.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{s.duration_minutes} min</div>
                </div>
                <div style={{ fontWeight: '700', color: COLORS.sageGreen }}>
                  R$ {s.price?.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Passo 2: Data e Hora (Placeholder simplificado) */}
      {step === 2 && (
        <div>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>← Voltar</button>
          <h3 style={{ margin: '15px 0' }}>Para quando deseja agendar?</h3>
          <input 
            type="datetime-local" 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            onChange={(e) => {
               setBookingData({...bookingData, date: e.target.value});
               setStep(3);
            }}
          />
        </div>
      )}

      {/* Passo 3: Confirmação Final */}
      {step === 3 && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0 }}>Quase lá!</h3>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Agendando: <strong>{bookingData.service?.name}</strong><br/>
            Horário: <strong>{new Date(bookingData.date).toLocaleString()}</strong>
          </p>
          <input 
            placeholder="Seu Nome" 
            style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            onChange={e => setBookingData({...bookingData, clientName: e.target.value})}
          />
          <input 
            placeholder="Seu Telefone (WhatsApp)" 
            style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }}
            onChange={e => setBookingData({...bookingData, clientPhone: e.target.value})}
          />
          <button 
            style={{ width: '100%', padding: '15px', backgroundColor: COLORS.sageGreen, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => alert("Agendamento realizado com sucesso! (Aqui faremos o insert no Supabase)")}
          >
            Confirmar Agendamento
          </button>
        </div>
      )}
    </div>
  );
}