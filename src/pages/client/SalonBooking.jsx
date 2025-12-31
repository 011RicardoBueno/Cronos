import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import moment from 'moment';
import ClientHeader from '../../components/ui/ClientHeader';
import { createBookingSlot } from '../../services/supabaseService';

export default function SalonBooking({ publicMode = false, salonIdFromSlug = null }) {
  const { id: paramId, slug } = useParams();
  const navigate = useNavigate();
  
  const identifier = salonIdFromSlug || paramId || slug;

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientData, setClientData] = useState({ name: '', phone: '' });
  
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isBookingForOthers, setIsBookingForOthers] = useState(false);

  const formatPhone = (value) => {
    if (!value) return "";
    const phone = value.replace(/\D/g, "");
    if (phone.length <= 11) {
      return phone
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return phone.substring(0, 11).replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleContactSalon = () => {
    if (!salon?.phone) {
      alert("O salão não possui um número de contato cadastrado.");
      return;
    }
    const cleanNumber = salon.phone.replace(/\D/g, "");
    const finalNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(
      `Olá! Acabei de realizar um agendamento pelo site:\n\n` +
      `*Serviço:* ${selectedService.name}\n` +
      `*Data:* ${moment(selectedDate).format('DD/MM/YYYY')} às ${selectedTime}\n` +
      `*Nome:* ${clientData.name}\n\n` +
      `Tenho uma dúvida, poderiam me ajudar?`
    );
    window.open(`https://wa.me/${finalNumber}?text=${message}`, '_blank');
  };

  const resetForm = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedTime(null);
    setIsBookingForOthers(false);
  };

  // Carregamento de Perfil (Agora garantido pelo Cadastro Obrigatório)
  useEffect(() => {
    const loadUserProfile = async () => {
      if (publicMode) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsUserLoggedIn(true);
        setClientData({
          name: user.user_metadata?.full_name || '',
          phone: formatPhone(user.user_metadata?.phone || '')
        });
      }
    };
    loadUserProfile();
  }, [publicMode]);

  useEffect(() => {
    const loadData = async () => {
      if (!identifier) return;
      try {
        setLoading(true);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
        const query = supabase.from('salons').select('*');
        if (isUUID) query.eq('id', identifier);
        else query.eq('slug', identifier);

        const { data: salonData, error: sError } = await query.single();
        if (sError || !salonData) throw new Error("Salão não encontrado");

        setSalon(salonData);

        const [serRes, pRes] = await Promise.all([
          supabase.from('services').select('*').eq('salon_id', salonData.id).order('name'),
          supabase.from('professionals').select('*').eq('salon_id', salonData.id).order('name')
        ]);

        setServices(serRes.data || []);
        setProfessionals(pRes.data || []);
      } catch (err) {
        console.error("Erro ao carregar salão:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [identifier]);

  const fetchSlots = useCallback(async () => {
    if (!selectedProfessional || !selectedDate || !salon || !selectedService) return;

    const duration = selectedService.duration_minutes || 30;
    const startH = parseInt((salon.opening_time || '08:00').split(':')[0]);
    const endH = parseInt((salon.closing_time || '19:00').split(':')[0]);
    const endM = parseInt((salon.closing_time || '19:00').split(':')[1]);
    const salonLimitMinutes = endH * 60 + endM;

    const times = [];
    for (let h = startH; h < endH; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`, `${h.toString().padStart(2, '0')}:30`);
    }

    const startDay = moment(selectedDate).startOf('day').toISOString();
    const endDay = moment(selectedDate).endOf('day').toISOString();

    const { data: busy } = await supabase
      .from('slots')
      .select('start_time, end_time')
      .eq('professional_id', selectedProfessional.id)
      .gte('start_time', startDay)
      .lte('start_time', endDay);

    const busyIntervals = busy?.map(b => ({
      start: moment(b.start_time),
      end: moment(b.end_time)
    })) || [];

    const filtered = times.filter(t => {
      const slotStart = moment(`${selectedDate} ${t}`, 'YYYY-MM-DD HH:mm');
      const slotEnd = moment(slotStart).add(duration, 'minutes');
      const slotEndMinutes = slotEnd.hours() * 60 + slotEnd.minutes();

      if (slotEndMinutes > salonLimitMinutes) return false;
      if (slotStart.isBefore(moment().add(10, 'minutes'))) return false;

      const hasConflict = busyIntervals.some(interval => {
        return slotStart.isBefore(interval.end) && slotEnd.isAfter(interval.start);
      });

      return !hasConflict;
    });

    setAvailableSlots(filtered);
  }, [selectedProfessional, selectedDate, salon, selectedService]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleBooking = async () => {
    if (!clientData.name.trim() || clientData.phone.length < 14) {
      alert("Por favor, preencha nome e telefone corretamente.");
      return;
    }
    try {
      setIsProcessing(true);
      const startTime = moment(`${selectedDate} ${selectedTime}`).toISOString();
      const { data: conflict } = await supabase.from('slots').select('id').eq('professional_id', selectedProfessional.id).eq('start_time', startTime).maybeSingle();
      
      if (conflict) {
        alert("Este horário acabou de ser preenchido. Por favor, escolha outro.");
        setStep(2);
        fetchSlots();
        return;
      }

      let finalClientId = null;
      if (!publicMode) {
        const { data: { user } } = await supabase.auth.getUser();
        finalClientId = user?.id;
      }

      const duration = selectedService.duration_minutes || 30;
      const endTime = moment(startTime).add(duration, 'minutes').toISOString();

      await createBookingSlot({
        salonId: salon.id,
        professionalId: selectedProfessional.id,
        serviceId: selectedService.id,
        clientId: finalClientId,
        clientName: clientData.name.trim(),
        clientPhone: clientData.phone.trim(),
        startTime: startTime,
        endTime: endTime
      });
      
      setStep(4);
    } catch (err) { 
      console.error("Erro ao agendar:", err);
      alert("Erro ao realizar agendamento."); 
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh' }}>
      {!publicMode && <ClientHeader />}
      <div style={styles.center}>Carregando...</div>
    </div>
  );

  const isFormValid = clientData.name.trim().length > 2 && clientData.phone.length >= 14;

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh' }}>
      {!publicMode && <ClientHeader />}
      <div style={styles.container}>
        {step === 1 && (
          <section>
            <div style={styles.headerRow}>
              {!publicMode && <button onClick={() => navigate(-1)} style={styles.backIconBtn}><ArrowLeft size={20}/></button>}
              <h3 style={styles.sectionTitle}>Selecione o Serviço</h3>
            </div>
            <div style={styles.list}>
              {services.map(s => (
                <div key={s.id} onClick={() => { setSelectedService(s); setStep(2); }} style={styles.card}>
                  <div>
                    <div style={styles.bold}>{s.name}</div>
                    <div style={styles.sub}>{s.duration_minutes} min</div>
                  </div>
                  <div style={styles.price}>R$ {Number(s.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <button onClick={() => setStep(1)} style={styles.backBtn}>← Voltar aos serviços</button>
            <h3 style={styles.sectionTitle}>Com quem e quando?</h3>
            <div style={styles.profRow}>
              {professionals.map(p => (
                <div key={p.id} onClick={() => setSelectedProfessional(p)} style={{...styles.profCard, borderColor: selectedProfessional?.id === p.id ? COLORS.sageGreen : '#eee'}}>
                  <div style={styles.avatar}>{p.name[0]}</div>
                  <div style={styles.sub}>{p.name}</div>
                </div>
              ))}
            </div>
            <input type="date" value={selectedDate} min={moment().format('YYYY-MM-DD')} onChange={e => setSelectedDate(e.target.value)} style={styles.input} />
            <div style={styles.timeGrid}>
              {availableSlots.length > 0 ? availableSlots.map(t => (
                <button key={t} onClick={() => { setSelectedTime(t); setStep(3); }} style={styles.timeBtn}>{t}</button>
              )) : (
                <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: '#999'}}>Nenhum horário disponível para esta data.</div>
              )}
            </div>
          </section>
        )}

        {step === 3 && (
          <section style={styles.confirmCard}>
            <h3 style={styles.sectionTitle}>Finalizar Agendamento</h3>
            <div style={styles.summaryBox}>
              <div style={{marginBottom: '8px'}}><strong>{selectedService.name}</strong></div>
              <div style={styles.sub}>Profissional: {selectedProfessional.name}</div>
              <div style={styles.sub}>📅 {moment(selectedDate).format('DD/MM/YYYY')} às {selectedTime}</div>
            </div>

            {/* Checkbox para liberar edição apenas se for para terceiros */}
            {isUserLoggedIn && !publicMode && (
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#555'}}>
                  <input 
                    type="checkbox" 
                    checked={isBookingForOthers} 
                    onChange={(e) => setIsBookingForOthers(e.target.checked)}
                  />
                  Agendar para outra pessoa
                </label>
              </div>
            )}

            <label style={styles.label}>Nome do Cliente *</label>
            <input 
              placeholder="Nome de quem será atendido" 
              value={clientData.name} 
              disabled={isUserLoggedIn && !isBookingForOthers && !publicMode}
              onChange={e => setClientData({...clientData, name: e.target.value})} 
              style={{...styles.input, backgroundColor: (isUserLoggedIn && !isBookingForOthers && !publicMode) ? '#f5f5f5' : 'white'}} 
            />

            <label style={styles.label}>WhatsApp *</label>
            <input 
              placeholder="(11) 99999-9999" 
              type="tel" 
              value={clientData.phone} 
              disabled={isUserLoggedIn && !isBookingForOthers && !publicMode}
              onChange={e => setClientData({...clientData, phone: formatPhone(e.target.value)})} 
              style={{...styles.input, backgroundColor: (isUserLoggedIn && !isBookingForOthers && !publicMode) ? '#f5f5f5' : 'white'}} 
              maxLength={15} 
            />

            <button 
              onClick={handleBooking} 
              disabled={!isFormValid || isProcessing} 
              style={{
                ...styles.mainBtn, 
                backgroundColor: isFormValid && !isProcessing ? COLORS.deepCharcoal : '#ccc', 
                cursor: isFormValid && !isProcessing ? 'pointer' : 'not-allowed'
              }}
            >
              {isProcessing ? 'Reservando...' : 'Confirmar Agendamento'}
            </button>
            <button onClick={() => setStep(2)} style={styles.secondaryBtn}>Alterar data ou horário</button>
          </section>
        )}

        {step === 4 && (
          <div style={styles.center}>
            <CheckCircle size={60} color={COLORS.sageGreen} />
            <h2 style={{marginTop: '20px', color: COLORS.deepCharcoal, fontWeight: '700'}}>Agendado com sucesso!</h2>
            <p style={{color: '#666', marginBottom: '25px', lineHeight: '1.5'}}>
              Tudo pronto! Seu horário foi reservado.<br/>
              Dúvidas? Entre em contato com o salão:
            </p>
            
            <button onClick={handleContactSalon} style={{...styles.mainBtn, backgroundColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px'}}>
              Falar com o Salão
            </button>

            <button 
              onClick={() => publicMode ? resetForm() : navigate('/meus-agendamentos')} 
              style={styles.secondaryBtn}
            >
              {publicMode ? 'Fazer outro agendamento' : 'Ver meus agendamentos'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '0 20px 40px' },
  center: { textAlign: 'center', padding: '50px', color: '#666' },
  sectionTitle: { fontSize: '1.2rem', marginBottom: '20px', color: COLORS.deepCharcoal, fontWeight: '700' },
  headerRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  list: { display: 'grid', gap: '12px' },
  card: { padding: '18px', backgroundColor: 'white', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' },
  bold: { fontWeight: '700', color: COLORS.deepCharcoal },
  sub: { fontSize: '0.85rem', color: '#888' },
  price: { color: COLORS.sageGreen, fontWeight: '800' },
  profRow: { display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', padding: '5px' },
  profCard: { padding: '15px', backgroundColor: 'white', borderRadius: '12px', border: '2px solid', minWidth: '85px', textAlign: 'center', cursor: 'pointer' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: COLORS.warmSand, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#666', marginBottom: '5px', marginLeft: '4px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '15px', boxSizing: 'border-box' },
  timeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
  timeBtn: { padding: '12px 5px', borderRadius: '10px', border: '1px solid #eee', cursor: 'pointer', fontWeight: '600' },
  mainBtn: { width: '100%', padding: '16px', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: '0.2s' },
  secondaryBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginTop: '10px' },
  backBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '15px' },
  backIconBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  summaryBox: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }
};