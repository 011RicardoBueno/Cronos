import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import moment from 'moment';
import ClientHeader from '../../components/ui/ClientHeader';

export default function SalonBooking({ publicMode = false, salonIdFromSlug = null }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  
  const identifier = salonIdFromSlug || paramId;

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientData, setClientData] = useState({ name: '', phone: '' });

  // --- FUNÇÃO DE MÁSCARA ---
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

  // --- AUTO-FILL DE DADOS DO USUÁRIO ---
  useEffect(() => {
    const loadUserProfile = async () => {
      if (publicMode) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
          supabase.from('services').select('*').eq('salon_id', salonData.id),
          supabase.from('professionals').select('*').eq('salon_id', salonData.id)
        ]);

        setServices(serRes.data || []);
        setProfessionals(pRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [identifier]);

  const fetchSlots = useCallback(async () => {
    if (!selectedProfessional || !selectedDate || !salon) return;

    let startH = parseInt((salon.opening_time || '08:00').split(':')[0]);
    let endH = parseInt((salon.closing_time || '19:00').split(':')[0]);
    if (endH <= startH) endH = 24;

    const times = [];
    for (let h = startH; h < endH; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`, `${h.toString().padStart(2, '0')}:30`);
    }

    const startDay = moment(selectedDate).startOf('day').toISOString();
    const endDay = moment(selectedDate).endOf('day').toISOString();

    const { data: busy } = await supabase
      .from('slots')
      .select('start_time')
      .eq('professional_id', selectedProfessional.id)
      .gte('start_time', startDay)
      .lte('start_time', endDay);

    const busyTimes = busy?.map(b => moment(b.start_time).format('HH:mm')) || [];
    const filtered = times.filter(t => {
      const isPast = moment(`${selectedDate} ${t}`).isBefore(moment().add(10, 'minutes'));
      return !busyTimes.includes(t) && !isPast;
    });
    setAvailableSlots(filtered);
  }, [selectedProfessional, selectedDate, salon]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleBooking = async () => {
    if (!clientData.name.trim() || clientData.phone.length < 14) {
      alert("Por favor, preencha nome e telefone corretamente.");
      return;
    }

    try {
      const startTime = moment(`${selectedDate} ${selectedTime}`).toISOString();
      
      // --- BLOQUEIO DE CONCORRÊNCIA (DOUBLE BOOKING) ---
      const { data: conflict } = await supabase
        .from('slots')
        .select('id')
        .eq('professional_id', selectedProfessional.id)
        .eq('start_time', startTime)
        .maybeSingle();

      if (conflict) {
        alert("Este horário acabou de ser preenchido por outra pessoa. Por favor, escolha outro.");
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

      const { error } = await supabase.from('slots').insert([{
        salon_id: salon.id,
        professional_id: selectedProfessional.id,
        service_id: selectedService.id,
        client_id: finalClientId,
        client_name: clientData.name.trim(),
        client_phone: clientData.phone.trim(),
        start_time: startTime,
        end_time: endTime,
        status: 'confirmed'
      }]);

      if (error) throw error;
      setStep(4);
    } catch (err) { alert(err.message); }
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
              {availableSlots.map(t => (
                <button key={t} onClick={() => { setSelectedTime(t); setStep(3); }} style={styles.timeBtn}>{t}</button>
              ))}
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

            <label style={styles.label}>Seu Nome *</label>
            <input 
              placeholder="Digite seu nome completo" 
              value={clientData.name} 
              onChange={e => setClientData({...clientData, name: e.target.value})} 
              style={styles.input} 
            />

            <label style={styles.label}>WhatsApp com DDD *</label>
            <input 
              placeholder="(11) 99999-9999" 
              type="tel"
              value={clientData.phone} 
              onChange={e => setClientData({
                ...clientData, 
                phone: formatPhone(e.target.value)
              })} 
              style={styles.input} 
              maxLength={15}
            />

            <button 
              onClick={handleBooking} 
              disabled={!isFormValid}
              style={{
                ...styles.mainBtn,
                backgroundColor: isFormValid ? COLORS.deepCharcoal : '#ccc',
                cursor: isFormValid ? 'pointer' : 'not-allowed'
              }}
            >
              Confirmar Agendamento
            </button>
            
            <button onClick={() => setStep(2)} style={styles.secondaryBtn}>
              Alterar data ou horário
            </button>
          </section>
        )}

        {step === 4 && (
          <div style={styles.center}>
            <CheckCircle size={60} color={COLORS.sageGreen} />
            <h2 style={{marginTop: '20px', color: COLORS.deepCharcoal}}>Agendado com sucesso!</h2>
            <p style={{color: '#666', marginBottom: '30px'}}>O profissional já recebeu seu pedido.</p>
            <button onClick={() => navigate('/meus-agendamentos')} style={styles.mainBtn}>Ver Meus Agendamentos</button>
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