import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';

const SalonBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados de dados do Banco
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de seleção do usuário
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(null);

  // 1. Carregar dados iniciais do Salão
  useEffect(() => {
    const fetchSalonDetails = async () => {
      try {
        setLoading(true);
        const [salonRes, servicesRes, profsRes] = await Promise.all([
          supabase.from('salons').select('*').eq('id', id).single(),
          supabase.from('services').select('*').eq('salon_id', id),
          supabase.from('professionals').select('*').eq('salon_id', id)
        ]);

        setSalon(salonRes.data);
        setServices(servicesRes.data || []);
        setProfessionals(profsRes.data || []);
      } catch (err) {
        console.error('Erro ao carregar detalhes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalonDetails();
  }, [id]);

  // 2. Gerar e filtrar horários disponíveis
  useEffect(() => {
    const generateAndFilterSlots = async () => {
      if (!selectedProfessional || !selectedDate) return;

      // Gera horários das 09:00 às 18:00
      const allPossibleSlots = [];
      for (let i = 9; i < 18; i++) {
        allPossibleSlots.push(`${i.toString().padStart(2, '0')}:00`);
        allPossibleSlots.push(`${i.toString().padStart(2, '0')}:30`);
      }

      // Busca o que já está ocupado no banco
      const { data: busySlots } = await supabase
        .from('slots')
        .select('start_time')
        .eq('professional_id', selectedProfessional.id)
        .gte('start_time', `${selectedDate}T00:00:00`)
        .lte('start_time', `${selectedDate}T23:59:59`);

      const busyTimes = busySlots?.map(s => {
        const date = new Date(s.start_time);
        return date.getUTCHours().toString().padStart(2, '0') + ":" + 
               date.getUTCMinutes().toString().padStart(2, '0');
      }) || [];

      setAvailableSlots(allPossibleSlots.filter(t => !busyTimes.includes(t)));
    };

    generateAndFilterSlots();
  }, [selectedProfessional, selectedDate]);

  // 3. Função de Confirmação Final
  const handleConfirmBooking = async () => {
    try {
      if (!selectedService || !selectedProfessional || !selectedTime) return;

      const { data: { user } } = await supabase.auth.getUser();
      
      const startTime = new Date(`${selectedDate}T${selectedTime}:00Z`).toISOString();
      const durationMs = (selectedService.duration || 30) * 60000;
      const endTime = new Date(new Date(startTime).getTime() + durationMs).toISOString();

      const { error } = await supabase.from('slots').insert([{
        salon_id: id,
        professional_id: selectedProfessional.id,
        service_id: selectedService.id,
        client_id: user.id,
        start_time: startTime,
        end_time: endTime,
        client_name: user.user_metadata?.full_name || user.email,
        status: 'confirmed'
      }]);

      if (error) throw error;

      alert("Agendamento realizado com sucesso!");
      navigate('/agendamento-cliente');
    } catch (err) {
      alert("Erro ao agendar: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando opções...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.offWhite, padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <button 
          onClick={() => navigate(-1)}
          style={{ marginBottom: '20px', background: 'none', border: 'none', color: COLORS.deepCharcoal, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          ← Voltar para busca
        </button>

        <div style={{ backgroundColor: COLORS.white, padding: '20px', borderRadius: '16px', marginBottom: '25px', border: `1px solid ${COLORS.warmSand}` }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{salon?.name}</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>📍 {salon?.address}</p>
        </div>

        {/* PASSO 1: SERVIÇO */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: COLORS.deepCharcoal }}>1. Selecione o Serviço</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {services.map(s => (
              <div 
                key={s.id}
                onClick={() => setSelectedService(s)}
                style={{
                  padding: '15px', backgroundColor: COLORS.white, borderRadius: '12px', cursor: 'pointer',
                  border: `2px solid ${selectedService?.id === s.id ? COLORS.sageGreen : 'transparent'}`,
                  display: 'flex', justifyContent: 'space-between', transition: '0.2s'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{s.duration} min</div>
                </div>
                <div style={{ fontWeight: 'bold', color: COLORS.sageGreen }}>R$ {Number(s.price).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PASSO 2: PROFISSIONAL */}
        {selectedService && (
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px', color: COLORS.deepCharcoal }}>2. Escolha o Profissional</h2>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
              {professionals.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedProfessional(p)}
                  style={{
                    minWidth: '90px', padding: '15px', backgroundColor: COLORS.white, borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${selectedProfessional?.id === p.id ? COLORS.sageGreen : 'transparent'}`
                  }}
                >
                  <div style={{ width: '40px', height: '40px', backgroundColor: COLORS.warmSand, borderRadius: '50%', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.name.charAt(0)}
                  </div>
                  <div style={{ fontSize: '13px' }}>{p.name}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PASSO 3: DATA E HORA */}
        {selectedProfessional && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px', color: COLORS.deepCharcoal }}>3. Data e Horário</h2>
            <input 
              type="date" 
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(null); }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.warmSand}`, marginBottom: '20px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '10px' }}>
              {availableSlots.map(time => (
                <div 
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  style={{
                    padding: '10px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                    backgroundColor: selectedTime === time ? COLORS.sageGreen : COLORS.white,
                    color: selectedTime === time ? 'white' : COLORS.deepCharcoal,
                    border: `1px solid ${selectedTime === time ? COLORS.sageGreen : COLORS.warmSand}`
                  }}
                >
                  {time}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BOTÃO FINAL */}
        {selectedTime && (
          <button 
            onClick={handleConfirmBooking}
            style={{
              width: '100%', padding: '20px', backgroundColor: COLORS.deepCharcoal, color: 'white',
              border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            Confirmar para {selectedTime}
          </button>
        )}
      </div>
    </div>
  );
};

export default SalonBooking;