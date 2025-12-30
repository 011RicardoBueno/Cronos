import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { COLORS } from '../../constants/dashboard';

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); 

  const [bookingData, setBookingData] = useState({
    service: null,
    date: '',
    clientName: '',
    clientPhone: ''
  });

  useEffect(() => {
    async function loadPublicData() {
      try {
        const { data: salonData, error: sError } = await supabase
          .from('salons')
          .select('*')
          .eq('slug', slug)
          .single();

        if (sError) throw sError;
        setSalon(salonData);

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

  // FUNÇÃO DE GRAVAÇÃO NO BANCO
  const handleConfirm = async () => {
    if (!bookingData.clientName || !bookingData.clientPhone || !bookingData.date) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Cálculo do horário de término
      const startTime = new Date(bookingData.date);
      const duration = bookingData.service.duration_minutes;
      const endTime = new Date(startTime.getTime() + duration * 60000);

      // 2. Buscar um profissional vinculado a este salão
      const { data: profs, error: profError } = await supabase
        .from('professionals')
        .select('id')
        .eq('salon_id', salon.id)
        .limit(1);

      if (profError || !profs || profs.length === 0) {
        throw new Error("Não foi possível encontrar um profissional para este salão.");
      }

      // 3. Inserir agendamento na tabela slots
      const { error: insertError } = await supabase
        .from('slots')
        .insert([{
          professional_id: profs[0].id,
          service_id: bookingData.service.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          client_name: bookingData.clientName,
          client_phone: bookingData.clientPhone,
          status: 'confirmed'
        }]);

      if (insertError) throw insertError;

      setStep(4); // Vai para a tela de sucesso
    } catch (err) {
      console.error("Erro ao agendar:", err);
      alert("Erro ao realizar agendamento: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>A carregar...</div>;
  if (!salon) return <div style={{ padding: '50px', textAlign: 'center' }}>Salão não encontrado.</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#f9f9f9', minHeight: '100vh', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: COLORS.deepCharcoal, marginBottom: '5px' }}>{salon.name}</h1>
        <div style={{ fontSize: '0.9rem', color: '#666', display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {salon.address || 'Ver morada'}</span>
        </div>
      </header>

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
            disabled={isSubmitting}
            style={{ 
              width: '100%', 
              padding: '15px', 
              backgroundColor: isSubmitting ? '#ccc' : COLORS.sageGreen, 
              color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' 
            }}
            onClick={handleConfirm}
          >
            {isSubmitting ? "Gravando..." : "Confirmar Agendamento"}
          </button>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CheckCircle2 size={60} color={COLORS.sageGreen} style={{ marginBottom: '20px' }} />
          <h2 style={{ color: COLORS.deepCharcoal }}>Agendamento Confirmado!</h2>
          <p style={{ color: '#666' }}>O salão já recebeu seu pedido. Esperamos por você!</p>
          <button 
            onClick={() => setStep(1)}
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'transparent', border: `1px solid ${COLORS.sageGreen}`, color: COLORS.sageGreen, borderRadius: '8px', cursor: 'pointer' }}
          >
            Fazer outro agendamento
          </button>
        </div>
      )}
    </div>
  );
}