import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';
import moment from 'moment';

const SalonBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    const fetchSalonDetails = async () => {
      try {
        setLoading(true);
        const [salonRes, servicesRes, profsRes] = await Promise.all([
          supabase.from('salons').select('*').eq('id', id).single(),
          supabase.from('services').select('*').eq('salon_id', id),
          supabase.from('professionals').select('*').eq('salon_id', id)
        ]);

        if (salonRes.error) throw salonRes.error;
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

  useEffect(() => {
    const generateAndFilterSlots = async () => {
      if (!selectedProfessional || !selectedDate || !salon) return;

      // 1. Define horário de funcionamento (usa o do salão ou padrão 08-20)
      const startHour = salon.opening_time ? parseInt(salon.opening_time.split(':')[0]) : 8;
      const endHour = salon.closing_time ? parseInt(salon.closing_time.split(':')[0]) : 20;

      const allPossibleSlots = [];
      for (let i = startHour; i < endHour; i++) {
        allPossibleSlots.push(`${i.toString().padStart(2, '0')}:00`);
        allPossibleSlots.push(`${i.toString().padStart(2, '0')}:30`);
      }

      // 2. Busca slots ocupados
      const { data: busySlots } = await supabase
        .from('slots')
        .select('start_time, end_time')
        .eq('professional_id', selectedProfessional.id)
        .gte('start_time', `${selectedDate}T00:00:00Z`)
        .lte('start_time', `${selectedDate}T23:59:59Z`);

      const busyTimes = busySlots?.map(s => moment(s.start_time).format('HH:mm')) || [];

      // 3. Filtra: Remove ocupados e horários passados (se for hoje)
      const filtered = allPossibleSlots.filter(t => {
        const isBusy = busyTimes.includes(t);
        const isPast = moment(`${selectedDate} ${t}`).isBefore(moment());
        return !isBusy && !isPast;
      });

      setAvailableSlots(filtered);
    };

    generateAndFilterSlots();
  }, [selectedProfessional, selectedDate, salon]);

  const handleConfirmBooking = async () => {
    try {
      if (!selectedService || !selectedProfessional || !selectedTime) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
      }
      
      const startTime = moment(`${selectedDate} ${selectedTime}`).toISOString();
      const duration = selectedService.duration_minutes || 30;
      const endTime = moment(startTime).add(duration, 'minutes').toISOString();

      const { error } = await supabase.from('slots').insert([{
        salon_id: id,
        professional_id: selectedProfessional.id,
        service_id: selectedService.id,
        client_id: user.id,
        start_time: startTime,
        end_time: endTime,
        client_name: user.user_metadata?.full_name || "Cliente",
        status: 'confirmed'
      }]);

      if (error) throw error;

      alert("Agendamento realizado com sucesso!");
      navigate('/agendamento-cliente'); // Ajuste para a rota de sucesso ou meus agendamentos
    } catch (err) {
      alert("Erro ao agendar: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando opções...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.offWhite, padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Voltar</button>

        <div style={styles.salonHeader}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>{salon?.name}</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>📍 {salon?.address}</p>
        </div>

        {/* SERVIÇO */}
        <section style={{ marginBottom: '25px' }}>
          <h2 style={styles.sectionTitle}>1. Escolha o Serviço</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {services.map(s => (
              <div 
                key={s.id}
                onClick={() => setSelectedService(s)}
                style={{
                  ...styles.card,
                  border: `2px solid ${selectedService?.id === s.id ? COLORS.sageGreen : 'transparent'}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{s.duration_minutes} min</div>
                </div>
                <div style={{ fontWeight: 'bold', color: COLORS.sageGreen }}>R$ {Number(s.price).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PROFISSIONAL */}
        {selectedService && (
          <section style={{ marginBottom: '25px' }}>
            <h2 style={styles.sectionTitle}>2. Com quem você quer agendar?</h2>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
              {professionals.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedProfessional(p)}
                  style={{
                    ...styles.profCard,
                    border: `2px solid ${selectedProfessional?.id === p.id ? COLORS.sageGreen : 'transparent'}`
                  }}
                >
                  <div style={styles.avatar}>{p.name.charAt(0)}</div>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>{p.name}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DATA E HORA */}
        {selectedProfessional && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={styles.sectionTitle}>3. Escolha o Horário</h2>
            <input 
              type="date" 
              min={moment().format('YYYY-MM-DD')}
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(null); }}
              style={styles.dateInput}
            />
            <div style={styles.timeGrid}>
              {availableSlots.length > 0 ? availableSlots.map(time => (
                <div 
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  style={{
                    ...styles.timeSlot,
                    backgroundColor: selectedTime === time ? COLORS.sageGreen : COLORS.white,
                    color: selectedTime === time ? 'white' : COLORS.deepCharcoal,
                    borderColor: selectedTime === time ? COLORS.sageGreen : COLORS.warmSand
                  }}
                >
                  {time}
                </div>
              )) : <p style={{ fontSize: '13px', color: '#999' }}>Nenhum horário disponível para este dia.</p>}
            </div>
          </section>
        )}

        {selectedTime && (
          <button onClick={handleConfirmBooking} style={styles.confirmBtn}>
            Confirmar para {moment(selectedDate).format('DD/MM')} às {selectedTime}
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  backBtn: { marginBottom: '20px', background: 'none', border: 'none', color: COLORS.deepCharcoal, cursor: 'pointer', fontSize: '14px' },
  salonHeader: { backgroundColor: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '25px', border: `1px solid ${COLORS.warmSand}` },
  sectionTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: COLORS.deepCharcoal },
  card: { padding: '15px', backgroundColor: '#fff', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s' },
  profCard: { minWidth: '80px', padding: '12px', backgroundColor: '#fff', borderRadius: '12px', cursor: 'pointer', textAlign: 'center' },
  avatar: { width: '35px', height: '35px', backgroundColor: COLORS.warmSand, borderRadius: '50%', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: COLORS.deepCharcoal },
  dateInput: { width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.warmSand}`, marginBottom: '20px', fontFamily: 'inherit' },
  timeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' },
  timeSlot: { padding: '10px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', border: '1px solid', transition: '0.2s' },
  confirmBtn: { width: '100%', padding: '18px', backgroundColor: COLORS.deepCharcoal, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
};

export default SalonBooking;