import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  fetchSalonByIdOrSlug,
  fetchServicesAndProfessionals,
  fetchProfessionalServices,
  fetchBusySlotsForDate,
  createBookingSlot
} from '../../services/supabaseService';
import { 
  MapPin, Clock, CheckCircle, Calendar, User, Scissors, 
  ChevronLeft, Share2, Loader2, Sparkles, Star, Phone, Users, CheckCircle2, Instagram 
} from 'lucide-react';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function PublicBookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [professionalServices, setProfessionalServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [user, setUser] = useState(null);
  const [isForSelf, setIsForSelf] = useState(true);

  const sanitizeName = (value) => value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "").replace(/\s\s+/g, ' ');
  const formatPhone = (value) => {
    const phone = value.replace(/\D/g, "");
    if (phone.length <= 11) return phone.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
    return phone.substring(0, 11).replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  useEffect(() => {
    async function loadData() {
      try {
        const salonData = await fetchSalonByIdOrSlug(slug);
        setSalon(salonData);
        document.title = `${salonData.name} | Agendar`;
        if (salonData.theme_name) {
          document.documentElement.setAttribute('data-theme', salonData.theme_name);
        }

        const { services, professionals } = await fetchServicesAndProfessionals(salonData.id);

        setServices(services);
        setProfessionals(professionals);

        if (professionals.length > 0) {
          const proServData = await fetchProfessionalServices(professionals.map(p => p.id));
          setProfessionalServices(proServData);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    }
    loadData();
  }, [slug]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (user && isForSelf) {
      setClientName(user.user_metadata?.full_name || '');
      setClientPhone(formatPhone(user.user_metadata?.phone || ''));
    } else if (!isForSelf) {
      setClientName('');
      setClientPhone('');
    }
  }, [user, isForSelf]);

  useEffect(() => {
    if (selectedProfessional && selectedDate) {
      const fetchOccupied = async () => {
        const busySlots = await fetchBusySlotsForDate(selectedProfessional.id, selectedDate);
        setOccupiedSlots(busySlots);
      };
      fetchOccupied();
    }
  }, [selectedDate, selectedProfessional]);

  const availableSlots = useMemo(() => {
    if (!salon || !selectedDate || !selectedService) return [];
    const open = salon.opening_time || '09:00';
    const close = salon.closing_time || '18:00';
    const duration = selectedService.duration_minutes;
    const dayStart = moment(`${selectedDate}T${open}`);
    const dayEnd = moment(`${selectedDate}T${close}`);
    const slots = [];

    const busyRanges = occupiedSlots.map(slot => ({
      start: moment(slot.start_time),
      end: moment(slot.end_time)
    }));

    let currentSlotStart = dayStart.clone();
    while (currentSlotStart.clone().add(duration, 'minutes').isSameOrBefore(dayEnd)) {
      const currentSlotEnd = currentSlotStart.clone().add(duration, 'minutes');
      const isPast = moment(selectedDate).isSame(moment(), 'day') && currentSlotStart.isBefore(moment().add(15, 'minutes'));

      const isOccupied = busyRanges.some(busyRange =>
        currentSlotStart.isBefore(busyRange.end) && currentSlotEnd.isAfter(busyRange.start)
      );

      if (!isPast && !isOccupied) {
        slots.push(currentSlotStart.format('HH:mm'));
      }
      currentSlotStart.add(duration, 'minutes');
    }
    return slots;
  }, [salon, selectedDate, selectedService, occupiedSlots]);

  const filteredProfessionals = useMemo(() => {
    if (!selectedService) return [];
    if (professionalServices.length === 0) return professionals;
    const linkedProIds = professionalServices
      .filter(ps => ps.service_id === selectedService.id)
      .map(ps => ps.professional_id);
    return professionals.filter(p => linkedProIds.includes(p.id));
  }, [selectedService, professionals, professionalServices]);

  const handleBooking = async () => {
    if (!selectedTime || clientName.length < 3) return;
    setSubmitting(true);
    try {
      const startTime = moment(`${selectedDate}T${selectedTime}`);
      const endTime = startTime.clone().add(selectedService.duration_minutes, 'minutes');

      await createBookingSlot({
        salonId: salon.id,
        professionalId: selectedProfessional.id,
        serviceId: selectedService.id,
        clientId: user?.id,
        clientName: clientName,
        clientPhone: clientPhone,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
      setBookingSuccess(true);
    } catch (error) { console.error("Booking error:", error); alert('Erro ao agendar.'); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-surface"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>;

  if (bookingSuccess) return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6 text-brand-text">
      <div className="bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] w-full max-w-md p-10 rounded-[2.5rem] text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-brand-primary/5">
            <CheckCircle2 size={40} className="text-brand-primary" />
        </div>
        <h2 className="text-3xl font-black mb-2 tracking-tighter">Reservado!</h2>
        <p className="text-brand-muted mb-8 font-medium">Seu horário foi confirmado com sucesso.</p>
        <button onClick={() => navigate(0)} className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold hover:scale-[1.02] transition-all">Novo Agendamento</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-surface pb-40 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full blur-[120px] opacity-20 bg-[var(--primary)] pointer-events-none z-0 animate-float" />
      <div className="fixed bottom-[10%] right-[-10%] w-[40%] aspect-square rounded-full blur-[100px] opacity-15 bg-[var(--accent)] pointer-events-none z-0 animate-float-delayed" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] aspect-square rounded-full blur-[150px] opacity-10 bg-[var(--primary)] pointer-events-none z-0" />
      
      {/* NOVO HERO SECTION COM BANNER E AVATAR */}
      <div className="relative h-[320px] w-full z-10">
        {/* Imagem de Banner (ou Fallback elegante) */}
        <div className="absolute inset-0 bg-brand-primary/20">
          <img 
            src={salon?.banner_url || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2070&auto=format&fit=crop'} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-brand-surface/20 to-black/30" />
        </div>
      </div>

      {/* CARD DE INFORMAÇÕES DO SALÃO (FLUTUANTE) */}
      <main className="max-w-4xl mx-auto px-6 -mt-32 relative z-20">
        <div className="bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-brand-primary/5 flex flex-col md:flex-row items-center md:items-end gap-6 mb-12">
          {/* Logo como Avatar flutuante */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-brand-card p-2 shadow-xl -mt-20 md:-mt-24 border border-brand-muted/10">
            <img 
                src={salon?.logo_url || 'https://ui-avatars.com/api/?name=' + salon?.name} 
                alt={salon?.name} 
                className="w-full h-full object-cover rounded-[1.5rem]" 
            />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h1 className="text-3xl md:text-4xl font-black text-brand-text tracking-tighter">{salon?.name}</h1>
                <CheckCircle2 size={20} className="text-brand-primary fill-brand-primary/10" />
            </div>
            <p className="text-brand-muted text-sm md:text-base flex items-center justify-center md:justify-start gap-2 font-medium">
              <MapPin size={18} className="text-brand-primary" /> {salon?.address}
            </p>
          </div>

          <div className="flex gap-2">
            {salon?.instagram_user ? (
              <button 
                onClick={() => window.open(`https://instagram.com/${salon.instagram_user.replace('@', '')}`, '_blank')}
                className="p-3 rounded-2xl bg-brand-card border border-brand-muted/20 text-brand-primary hover:bg-gradient-to-br from-pink-500 to-orange-400 hover:text-white transition-all shadow-sm">
                <Instagram size={20} />
              </button>
            ) : (
              <button className="p-3 rounded-2xl bg-brand-card border border-brand-muted/20 text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                  <Share2 size={20} />
              </button>
            )}
            <button className="px-6 py-3 rounded-2xl bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all">
                Seguir
            </button>
          </div>
        </div>

        {/* NUMERIC STEP INDICATORS (VIDRO) */}
        <div className="flex items-center justify-center mb-12 relative">
            <div className="absolute h-[2px] bg-brand-primary/10 w-48 md:w-64 top-1/2 -translate-y-1/2" />
            <div className="flex justify-between w-48 md:w-64 relative z-10">
                {[1, 2, 3].map((i) => (
                    <div 
                        key={i}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black transition-all duration-500 border-2 ${
                            step >= i 
                            ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-110' 
                            : 'bg-brand-card border-brand-muted/20 text-brand-muted'
                        }`}
                    >
                        {step > i ? <CheckCircle2 size={20} /> : i}
                    </div>
                ))}
            </div>
        </div>

        {/* CONTEÚDO DINÂMICO DOS PASSOS */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-black text-brand-text tracking-tight text-center">Selecione o Serviço</h2>
            <div className="grid gap-4">
              {services.map(service => (
                <button key={service.id} onClick={() => { setSelectedService(service); setStep(2); }}
                  className="w-full bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] border-t-white/20 border-l-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.05)] p-5 rounded-[2rem] flex items-center justify-between hover:bg-brand-card hover:shadow-xl transition-all group text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all overflow-hidden">
                      {service.image_url ? (
                        <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                      ) : (
                        <Scissors size={24} />
                      )}
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-brand-text">{service.name}</h3>
                        <p className="text-brand-muted text-sm font-medium">{service.duration_minutes || 30} min • <span className="text-brand-primary">R$ {service.price}</span></p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="rotate-180 text-brand-muted opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-bold text-brand-muted hover:text-brand-primary transition-colors"><ChevronLeft size={16}/> Voltar para serviços</button>
            <h2 className="text-2xl font-black text-brand-text tracking-tight">Com quem deseja agendar?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProfessionals.map(pro => (
                <button key={pro.id} onClick={() => { setSelectedProfessional(pro); setStep(3); }}
                  className={`relative overflow-hidden rounded-[2rem] border transition-all group text-left flex flex-col animate-in fade-in duration-500
                    ${selectedProfessional?.id === pro.id 
                      ? 'border-brand-primary bg-brand-primary/5 shadow-lg ring-2 ring-brand-primary/20' 
                      : 'bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-[var(--glass-border)] border-t-white/20 border-l-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.05)] hover:bg-brand-card hover:shadow-xl'
                    }`}>
                  {selectedProfessional?.id === pro.id && <div className="absolute top-3 right-3 z-10 bg-brand-primary text-white p-1 rounded-full shadow-lg"><CheckCircle2 size={14} /></div>}
                  <div className="w-full aspect-square bg-brand-muted/10 relative">
                    {pro.avatar_url ? (
                      <img src={pro.avatar_url} alt={pro.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-muted"><User size={40} /></div>
                    )}
                  </div>
                  <div className="p-4 w-full">
                    <h3 className={`font-black text-base mb-1 ${selectedProfessional?.id === pro.id ? 'text-brand-primary' : 'text-brand-text'}`}>{pro.name}</h3>
                    <p className="text-xs text-brand-muted line-clamp-2 font-medium leading-relaxed">{pro.bio || 'Profissional especialista.'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 pb-20">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-sm font-bold text-brand-muted hover:text-brand-primary transition-colors"><ChevronLeft size={16}/> Escolher outro profissional</button>
            
            <div className="bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] border-t-white/20 border-l-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.05)] rounded-[2.5rem] p-6 md:p-8 space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-text">
                    <Calendar size={20} className="text-brand-primary" />
                    <h3 className="font-black">Quando?</h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                      {Array.from({length: 12}).map((_, i) => {
                      const date = moment().add(i, 'days');
                      const isSelected = date.format('YYYY-MM-DD') === selectedDate;
                      return (
                          <button key={i} onClick={() => setSelectedDate(date.format('YYYY-MM-DD'))}
                          className={`flex-shrink-0 w-16 h-24 rounded-2xl flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-brand-primary text-white shadow-lg' : 'bg-brand-card border border-brand-muted/10 text-brand-muted hover:border-brand-primary'}`}>
                          <span className="text-[10px] font-bold uppercase">{date.format('ddd')}</span>
                          <span className="text-2xl font-black">{date.format('DD')}</span>
                          </button>
                      );
                      })}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-text">
                    <Clock size={20} className="text-brand-primary" />
                    <h3 className="font-black">Que horas?</h3>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {availableSlots.map(time => (
                      <button key={time} onClick={() => setSelectedTime(time)}
                          className={`py-3 rounded-xl text-sm font-bold transition-all ${selectedTime === time ? 'bg-brand-primary text-white' : 'bg-brand-card border border-brand-muted/10 text-brand-text hover:border-brand-primary'}`}>
                          {time}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4 pt-6 border-t border-brand-muted/10">
                  <div className="flex items-center gap-2 text-brand-text">
                    <User size={20} className="text-brand-primary" />
                    <h3 className="font-black">Seus dados</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input value={clientName} onChange={e => setClientName(sanitizeName(e.target.value))} placeholder="Nome Completo" className="w-full bg-brand-surface border border-brand-muted/10 p-4 rounded-2xl outline-none focus:border-brand-primary transition-all font-medium" />
                    <input value={clientPhone} onChange={e => setClientPhone(formatPhone(e.target.value))} placeholder="WhatsApp" className="w-full bg-brand-surface border border-brand-muted/10 p-4 rounded-2xl outline-none focus:border-brand-primary transition-all font-medium" />
                  </div>
                </section>
            </div>
          </div>
        )}
      </main>

      {/* RODAPÉ DE AÇÃO COM RESUMO */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-t border-[var(--glass-border)] z-50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="hidden md:block">
                <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">Resumo da Reserva</p>
                <p className="text-lg font-black text-brand-text">{selectedService?.name} • R$ {selectedService?.price}</p>
            </div>
            <button onClick={handleBooking} disabled={!selectedTime || submitting || clientName.length < 3} className="w-full md:w-80 bg-brand-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="animate-spin" /> : <>Confirmar Agendamento <CheckCircle2 size={20}/></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}