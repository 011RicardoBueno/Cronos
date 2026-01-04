import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Kept for auth calls
import { CheckCircle, ArrowLeft } from 'lucide-react';
import moment from 'moment';
import ClientHeader from '@/components/ui/ClientHeader';
import { 
  createBookingSlot, 
  fetchSalonByIdOrSlug, 
  fetchServicesAndProfessionals,
  fetchBusySlotsForDate
} from '@/services/supabaseService';

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
        const salonData = await fetchSalonByIdOrSlug(identifier);
        setSalon(salonData);

        const { services, professionals } = await fetchServicesAndProfessionals(salonData.id);
        setServices(services);
        setProfessionals(professionals);
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

    const busy = await fetchBusySlotsForDate(selectedProfessional.id, selectedDate);

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
    <div className="bg-brand-surface min-h-screen">
      {!publicMode && <ClientHeader />}
      <div className="text-center p-12 text-brand-muted">Carregando...</div>
    </div>
  );

  const isFormValid = clientData.name.trim().length > 2 && clientData.phone.length >= 14;

  return (
    <div className="bg-brand-surface min-h-screen">
      {!publicMode && <ClientHeader />}
      <div className="max-w-lg mx-auto px-5 pb-10">
        {step === 1 && (
          <section>
            <div className="flex items-center gap-2.5 mb-5">
              {!publicMode && <button onClick={() => navigate(-1)} className="p-2"><ArrowLeft size={20}/></button>}
              <h3 className="text-lg mb-5 text-brand-text font-bold">Selecione o Serviço</h3>
            </div>
            <div className="grid gap-3">
              {services.map(s => (
                <div key={s.id} onClick={() => { setSelectedService(s); setStep(2); }} className="p-4 bg-brand-card rounded-2xl flex justify-between items-center cursor-pointer shadow-sm border border-brand-muted/10 hover:border-brand-primary transition-all">
                  <div>
                    <div className="font-bold text-brand-text">{s.name}</div>
                    <div className="text-sm text-brand-muted">{s.duration_minutes} min</div>
                  </div>
                  <div className="text-brand-primary font-extrabold">R$ {Number(s.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <button onClick={() => setStep(1)} className="bg-none border-none text-brand-muted cursor-pointer mb-4">← Voltar aos serviços</button>
            <h3 className="text-lg mb-5 text-brand-text font-bold">Com quem e quando?</h3>
            <div className="flex gap-2.5 mb-5 overflow-x-auto p-1.5">
              {professionals.map(p => (
                <div key={p.id} onClick={() => setSelectedProfessional(p)} className={`p-4 bg-brand-card rounded-xl border-2 min-w-[85px] text-center cursor-pointer transition-all ${selectedProfessional?.id === p.id ? 'border-brand-primary' : 'border-brand-muted/20'}`}>
                  <div className="w-10 h-10 rounded-full bg-brand-surface mx-auto mb-2 flex items-center justify-center font-bold">{p.name[0]}</div>
                  <div className="text-sm text-brand-muted">{p.name}</div>
                </div>
              ))}
            </div>
            <input type="date" value={selectedDate} min={moment().format('YYYY-MM-DD')} onChange={e => setSelectedDate(e.target.value)} className="w-full p-3.5 rounded-xl border border-brand-muted/30 mb-4 box-border bg-brand-card text-brand-text" />
            <div className="grid grid-cols-4 gap-2.5">
              {availableSlots.length > 0 ? availableSlots.map(t => (
                <button key={t} onClick={() => { setSelectedTime(t); setStep(3); }} className="p-3 rounded-lg border border-brand-muted/20 cursor-pointer font-semibold bg-brand-card text-brand-text hover:border-brand-primary">{t}</button>
              )) : (
                <div className="col-span-full text-center p-5 text-brand-muted">Nenhum horário disponível para esta data.</div>
              )}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="bg-brand-card p-6 rounded-2xl border border-brand-muted/10 shadow-lg">
            <h3 className="text-lg mb-5 text-brand-text font-bold">Finalizar Agendamento</h3>
            <div className="bg-brand-surface p-5 rounded-2xl mb-5 border border-brand-muted/10 shadow-inner">
              <div className="mb-2 font-bold text-brand-text">{selectedService.name}</div>
              <div className="text-sm text-brand-muted">Profissional: {selectedProfessional.name}</div>
              <div className="text-sm text-brand-muted">📅 {moment(selectedDate).format('DD/MM/YYYY')} às {selectedTime}</div>
            </div>

            {isUserLoggedIn && !publicMode && (
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-brand-muted">
                  <input 
                    type="checkbox" 
                    checked={isBookingForOthers} 
                    onChange={(e) => setIsBookingForOthers(e.target.checked)}
                    className="form-checkbox rounded text-brand-primary focus:ring-brand-primary"
                  />
                  Agendar para outra pessoa
                </label>
              </div>
            )}

            <label className="block text-sm font-semibold text-brand-muted mb-1 ml-1">Nome do Cliente *</label>
            <input 
              placeholder="Nome de quem será atendido" 
              value={clientData.name} 
              disabled={isUserLoggedIn && !isBookingForOthers && !publicMode}
              onChange={e => setClientData({...clientData, name: e.target.value})} 
              className={`w-full p-3.5 rounded-xl border border-brand-muted/30 mb-4 box-border text-brand-text ${(isUserLoggedIn && !isBookingForOthers && !publicMode) ? 'bg-brand-surface/50' : 'bg-brand-surface'}`}
            />

            <label className="block text-sm font-semibold text-brand-muted mb-1 ml-1">WhatsApp *</label>
            <input 
              placeholder="(11) 99999-9999" 
              type="tel" 
              value={clientData.phone} 
              disabled={isUserLoggedIn && !isBookingForOthers && !publicMode}
              onChange={e => setClientData({...clientData, phone: formatPhone(e.target.value)})} 
              className={`w-full p-3.5 rounded-xl border border-brand-muted/30 mb-4 box-border text-brand-text ${(isUserLoggedIn && !isBookingForOthers && !publicMode) ? 'bg-brand-surface/50' : 'bg-brand-surface'}`}
              maxLength={15} 
            />

            <button 
              onClick={handleBooking} 
              disabled={!isFormValid || isProcessing} 
              className="w-full p-4 text-white border-none rounded-xl font-bold text-base transition-all disabled:bg-brand-muted disabled:cursor-not-allowed bg-brand-primary"
            >
              {isProcessing ? 'Reservando...' : 'Confirmar Agendamento'}
            </button>
            <button onClick={() => setStep(2)} className="w-full p-3 bg-none border-none text-brand-muted cursor-pointer mt-2.5">Alterar data ou horário</button>
          </section>
        )}

        {step === 4 && (
          <div className="text-center p-12 text-brand-muted">
            <CheckCircle size={60} className="text-brand-primary mx-auto" />
            <h2 className="mt-5 text-brand-text font-bold text-xl">Agendado com sucesso!</h2>
            <p className="mb-6 leading-relaxed">
              Tudo pronto! Seu horário foi reservado.<br/>
              Dúvidas? Entre em contato com o salão:
            </p>
            
            <button onClick={handleContactSalon} className="w-full p-4 text-white border-none rounded-xl font-bold text-base transition-all bg-[#25D366] flex items-center justify-center gap-2.5 mb-4">
              Falar com o Salão
            </button>

            <button 
              onClick={() => publicMode ? resetForm() : navigate('/meus-agendamentos')} 
              className="w-full p-3 bg-none border-none text-brand-muted cursor-pointer mt-2.5"
            >
              {publicMode ? 'Fazer outro agendamento' : 'Ver meus agendamentos'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}