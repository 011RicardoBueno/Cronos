import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  MapPin, Clock, CheckCircle, Calendar, User, Scissors, 
  ChevronLeft, Share2, Loader2, Sparkles, Star, Phone, Users 
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

  useEffect(() => {
    async function loadData() {
      try {
        const { data: salonData, error: salonError } = await supabase
          .from('salons').select('*').eq('slug', slug).single();
        if (salonError) throw salonError;
        setSalon(salonData);
        document.title = `${salonData.name} | Agendar`;

        const [servRes, proRes] = await Promise.all([
          supabase.from('services').select('*').eq('salon_id', salonData.id).order('price'),
          supabase.from('professionals').select('*').eq('salon_id', salonData.id)
        ]);
        setServices(servRes.data || []);
        setProfessionals(proRes.data || []);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    }
    loadData();
  }, [slug]);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (isForSelf) {
        setClientName(user.user_metadata?.full_name || '');
        setClientPhone(user.user_metadata?.phone || '');
      } else {
        setClientName('');
        setClientPhone('');
      }
    }
  }, [user, isForSelf]);

  useEffect(() => {
    if (selectedProfessional && selectedDate) {
      const fetchOccupiedSlots = async () => {
        const startOfDay = moment(selectedDate).startOf('day').toISOString();
        const endOfDay = moment(selectedDate).endOf('day').toISOString();

        const { data } = await supabase
          .from('slots')
          .select('start_time')
          .eq('professional_id', selectedProfessional.id)
          .eq('status', 'confirmed')
          .gte('start_time', startOfDay)
          .lte('start_time', endOfDay);

        if (data) {
          setOccupiedSlots(data.map(s => moment(s.start_time).format('HH:mm')));
        } else {
          setOccupiedSlots([]);
        }
      };
      fetchOccupiedSlots();
    }
  }, [selectedDate, selectedProfessional]);

  const getAvailableSlots = () => {
    const baseSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    return baseSlots.filter(time => {
      // Rule A: Past Time
      if (moment(selectedDate).isSame(moment(), 'day')) {
        const [h, m] = time.split(':');
        const slotTime = moment(selectedDate).set({ hour: parseInt(h), minute: parseInt(m) });
        if (slotTime.isBefore(moment())) return false;
      }
      // Rule B: Double-Booking
      if (occupiedSlots.includes(time)) return false;
      return true;
    });
  };

  const handleBooking = async () => {
    if (!clientName || !clientPhone || !selectedTime) return;
    setSubmitting(true);
    try {
      const startTime = moment(`${selectedDate}T${selectedTime}`).toISOString();
      const { error } = await supabase.from('slots').insert({
        salon_id: salon.id,
        professional_id: selectedProfessional.id,
        service_id: selectedService.id,
        client_name: clientName,
        client_phone: clientPhone,
        start_time: startTime,
        status: 'confirmed'
      });
      if (error) throw error;
      setBookingSuccess(true);
    } catch (error) { alert('Erro ao agendar.'); } 
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  if (bookingSuccess) {
    const startTime = moment(`${selectedDate}T${selectedTime}`).format('YYYYMMDDTHHmmss');
    const endTime = moment(`${selectedDate}T${selectedTime}`)
      .add(selectedService?.duration || 30, 'minutes')
      .format('YYYYMMDDTHHmmss');
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Agendamento: ${selectedService?.name} - ${salon?.name}`)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(`Profissional: ${selectedProfessional?.name}. Reservado via sistema.`)}&location=${encodeURIComponent(salon?.address || '')}`;

    const whatsappMessage = `Olá! Acabei de agendar ${selectedService?.name} para o dia ${moment(selectedDate).format('DD/MM')} às ${selectedTime} no ${salon?.name}.`;
    const salonPhone = salon?.phone ? salon.phone.replace(/\D/g, '') : '';
    const whatsappUrl = `https://wa.me/${salonPhone ? (salonPhone.length <= 11 ? '55' + salonPhone : salonPhone) : ''}?text=${encodeURIComponent(whatsappMessage)}`;

    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6 text-brand-text">
        <div className="bg-brand-card w-full max-w-md p-10 rounded-[2.5rem] border border-brand-muted/20 shadow-2xl text-center">
          <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
            <CheckCircle size={56} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-black mb-2 tracking-tight">Tudo pronto!</h2>
          <p className="text-brand-muted mb-8 italic">Seu momento de cuidado está reservado.</p>
          
          <div className="bg-brand-surface p-5 rounded-3xl mb-8 text-left border border-brand-muted/10 space-y-3">
            <div className="flex items-center gap-4 text-sm font-medium">
              <Calendar size={18} className="text-brand-primary" />
              <span>{moment(selectedDate).format('dddd, DD [de] MMMM')} às {selectedTime}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Scissors size={18} className="text-brand-primary" />
              <span>{selectedService?.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <User size={18} className="text-brand-primary" />
              <span>Profissional: {selectedProfessional?.name}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            {user ? (
              <>
                <button 
                  onClick={() => navigate('/meus-agendamentos')}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-primary/20"
                >
                  Ver Meus Agendamentos
                </button>
                <button 
                  onClick={() => navigate('/agendamento-cliente')}
                  className="w-full py-4 bg-transparent text-brand-muted rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-muted/5 transition-all"
                >
                  Voltar para o Início
                </button>
              </>
            ) : (
              <button 
                onClick={() => navigate('/agendamento-cliente')}
                className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-primary/20"
              >
                Voltar para o Início
              </button>
            )}
          </div>

          <div className="pt-6 border-t border-brand-muted/10">
            <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-4">Lembretes & Compartilhar</p>
            <div className="flex gap-3">
              <a 
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-brand-surface text-brand-text rounded-xl font-bold flex items-center justify-center gap-2 border border-brand-muted/20 hover:border-brand-primary/50 transition-all text-xs"
              >
                <Calendar size={16} /> Agenda
              </a>
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-[#25D366]/5 text-[#25D366] rounded-xl font-bold flex items-center justify-center gap-2 border border-[#25D366]/20 hover:bg-[#25D366]/10 transition-all text-xs"
              >
                <Share2 size={16} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col transition-colors duration-500 pb-32">
      {/* HEADER ELEGANTE */}
      <div className="relative h-64 md:h-80 w-full">
        <div className="absolute inset-0 bg-brand-primary/20 mix-blend-overlay z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-brand-surface/60 to-transparent z-20" />
        <img 
          src={salon?.logo_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200'} 
          className="w-full h-full object-cover" 
          alt="Salon background"
        />
        <div className="absolute bottom-10 left-0 right-0 px-6 z-30 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-brand-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <Star size={12} fill="currentColor" /> Favorito
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-text tracking-tighter mb-2">{salon?.name}</h1>
          <p className="flex items-center gap-2 text-brand-muted text-sm font-medium">
            <MapPin size={16} className="text-brand-primary" /> {salon?.address}
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto w-full px-6 -mt-4 relative z-40">
        
        {/* STEPPER DINÂMICO */}
        <div className="flex items-center justify-between mb-12 bg-brand-card p-4 rounded-3xl border border-brand-muted/10 shadow-sm">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2 flex-1 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 border-2 ${
                step >= s ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'bg-brand-surface border-brand-muted/20 text-brand-muted'
              }`}>
                {step > s ? <CheckCircle size={20} /> : s}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-brand-primary' : 'text-brand-muted'}`}>
                {s === 1 ? 'Serviço' : s === 2 ? 'Equipe' : 'Horário'}
              </span>
            </div>
          ))}
        </div>

        {/* PASSO 1: SERVIÇOS (VITRINE) */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-brand-text tracking-tight">O que vamos fazer hoje?</h2>
              <Sparkles className="text-brand-primary animate-pulse" />
            </div>
            <div className="grid gap-4">
              {services.map(service => (
                <div 
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep(2); }}
                  className="bg-brand-card p-5 rounded-[2rem] border border-brand-muted/20 hover:border-brand-primary hover:scale-[1.01] cursor-pointer transition-all flex items-center gap-5 group"
                >
                  <div className="w-16 h-16 bg-brand-surface rounded-2xl flex items-center justify-center text-brand-primary group-hover:rotate-12 transition-transform shadow-inner">
                    <Scissors size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-brand-text group-hover:text-brand-primary transition-colors">{service.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-brand-muted mt-1 font-medium uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><Clock size={12} /> {service.duration} min</span>
                      <span className="w-1 h-1 bg-brand-muted rounded-full opacity-30" />
                      <span>Profissional Especialista</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-brand-text">R$ {service.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 2: PROFISSIONAIS */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-brand-muted font-bold text-sm bg-brand-card px-4 py-2 rounded-full border border-brand-muted/10 w-fit">
              <ChevronLeft size={16} /> Voltar para Serviços
            </button>
            <h2 className="text-2xl font-black text-brand-text tracking-tight">Com quem você prefere?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {professionals.map(pro => (
                <div 
                  key={pro.id}
                  onClick={() => { setSelectedProfessional(pro); setStep(3); }}
                  className="bg-brand-card pt-8 pb-6 px-4 rounded-[2.5rem] border border-brand-muted/20 hover:border-brand-primary cursor-pointer transition-all hover:shadow-xl text-center group"
                >
                  <div className="w-24 h-24 rounded-full bg-brand-surface mx-auto mb-4 overflow-hidden ring-4 ring-brand-surface group-hover:ring-brand-primary/20 transition-all border-2 border-transparent group-hover:border-brand-primary">
                    {pro.avatar_url ? (
                      <img src={pro.avatar_url} alt={pro.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-muted opacity-30">
                        <User size={40} />
                      </div>
                    )}
                  </div>
                  <h3 className="font-black text-brand-text mb-1 tracking-tight">{pro.name}</h3>
                  <div className="bg-brand-primary/5 text-brand-primary text-[10px] font-black uppercase py-1 px-3 rounded-full inline-block tracking-widest">
                    Expertise
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 3: DATA, HORÁRIO E CONFIRMAÇÃO */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-brand-muted font-bold text-sm bg-brand-card px-4 py-2 rounded-full border border-brand-muted/10 w-fit">
              <ChevronLeft size={16} /> Trocar Profissional
            </button>
            
            <section>
              <h2 className="text-xl font-black text-brand-text mb-4 tracking-tight">Quando ficaria melhor?</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {Array.from({length: 10}).map((_, i) => {
                  const date = moment().add(i, 'days');
                  const isSelected = date.format('YYYY-MM-DD') === selectedDate;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date.format('YYYY-MM-DD'))}
                      className={`flex-shrink-0 w-20 h-28 rounded-3xl flex flex-col items-center justify-center border transition-all ${
                        isSelected 
                        ? 'bg-brand-primary text-white border-brand-primary shadow-2xl shadow-brand-primary/40 scale-105' 
                        : 'bg-brand-card text-brand-muted border-brand-muted/20'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase opacity-60 mb-1">{date.format('ddd')}</span>
                      <span className="text-2xl font-black">{date.format('DD')}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-text mb-4 tracking-tight">Qual o melhor horário?</h2>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {getAvailableSlots().length === 0 ? (
                  <div className="col-span-full text-center text-brand-muted py-4 bg-brand-surface rounded-2xl border border-dashed border-brand-muted/30">
                    Nenhum horário disponível para esta data.
                  </div>
                ) : (
                  getAvailableSlots().map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-4 rounded-2xl text-sm font-black transition-all border ${
                        selectedTime === time
                        ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20'
                        : 'bg-brand-card text-brand-text border-brand-muted/10 hover:border-brand-primary/50'
                      }`}
                    >
                      {time}
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="bg-brand-card p-8 rounded-[2.5rem] border border-brand-muted/10 shadow-sm space-y-5">
              <h2 className="text-xl font-black text-brand-text tracking-tight">Só para confirmar...</h2>
              
              {user && (
                <div className="flex gap-3 mb-2">
                  <button 
                    onClick={() => setIsForSelf(true)}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm ${
                      isForSelf 
                      ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                      : 'bg-brand-surface text-brand-muted hover:bg-brand-muted/5 border border-brand-muted/10'
                    }`}
                  >
                    <User size={16} /> Para mim
                  </button>
                  <button 
                    onClick={() => setIsForSelf(false)}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm ${
                      !isForSelf 
                      ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                      : 'bg-brand-surface text-brand-muted hover:bg-brand-muted/5 border border-brand-muted/10'
                    }`}
                  >
                    <Users size={16} /> Para outra pessoa
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-primary transition-colors" size={18} />
                  <input 
                    type="text" placeholder="Como podemos te chamar?"
                    value={clientName} onChange={e => setClientName(e.target.value)}
                    readOnly={user && isForSelf}
                    className={`w-full rounded-2xl py-4 pl-12 pr-4 text-brand-text font-medium outline-none transition-all border ${
                      user && isForSelf 
                      ? 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary cursor-not-allowed' 
                      : 'bg-brand-surface border-brand-muted/20 focus:ring-2 focus:ring-brand-primary/30'
                    }`}
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-primary transition-colors" size={18} />
                  <input 
                    type="tel" placeholder="WhatsApp para lembrete"
                    value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                    readOnly={user && isForSelf}
                    className={`w-full rounded-2xl py-4 pl-12 pr-4 text-brand-text font-medium outline-none transition-all border ${
                      user && isForSelf 
                      ? 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary cursor-not-allowed' 
                      : 'bg-brand-surface border-brand-muted/20 focus:ring-2 focus:ring-brand-primary/30'
                    }`}
                  />
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* BOTÃO FIXO DE AÇÃO */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-brand-surface/80 backdrop-blur-md border-t border-brand-muted/10 z-50 animate-in slide-in-from-bottom-10">
          <div className="max-w-3xl mx-auto">
            <button 
              onClick={handleBooking}
              disabled={!selectedTime || !clientName || !clientPhone || submitting || !getAvailableSlots().includes(selectedTime)}
              className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-brand-primary/40 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {submitting ? <Loader2 className="animate-spin" /> : <>Reservar agora <Sparkles size={20}/></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}