import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, Clock, CheckCircle, Calendar, User, Scissors, ChevronLeft, Share2, Loader2 } from 'lucide-react';
import moment from 'moment';

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Booking State
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch Salon
        const { data: salonData, error: salonError } = await supabase
          .from('salons')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (salonError) throw salonError;
        setSalon(salonData);
        document.title = `${salonData.name} | Agendamento`;

        // 2. Fetch Services
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('salon_id', salonData.id)
          .order('price');
        setServices(servicesData || []);

        // 3. Fetch Professionals
        const { data: prosData } = await supabase
          .from('professionals')
          .select('*')
          .eq('salon_id', salonData.id);
        setProfessionals(prosData || []);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

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
    } catch (error) {
      console.error(error);
      alert('Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const generateDates = () => {
    const dates = [];
    for(let i=0; i<7; i++) {
      dates.push(moment().add(i, 'days'));
    }
    return dates;
  };

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface text-brand-muted">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );

  if (!salon) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface text-brand-text">
      <p>Salão não encontrado.</p>
    </div>
  );

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center p-4">
        <div className="bg-brand-card w-full max-w-md p-8 rounded-3xl border border-brand-muted/20 shadow-xl text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-brand-text mb-2">Agendamento Confirmado!</h2>
          <p className="text-brand-muted mb-8">Te esperamos em {salon.name}.</p>
          
          <div className="bg-brand-surface p-4 rounded-2xl mb-6 text-left border border-brand-muted/10">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={16} className="text-brand-primary" />
              <span className="text-brand-text font-medium">{moment(selectedDate).format('DD/MM/YYYY')} às {selectedTime}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Scissors size={16} className="text-brand-primary" />
              <span className="text-brand-text">{selectedService?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <User size={16} className="text-brand-primary" />
              <span className="text-brand-text">{selectedProfessional?.name}</span>
            </div>
          </div>

          <div className="space-y-3">
            <a 
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Agendamento em ' + salon.name)}&dates=${moment(`${selectedDate}T${selectedTime}`).format('YYYYMMDDTHHmmss')}/${moment(`${selectedDate}T${selectedTime}`).add(30, 'minutes').format('YYYYMMDDTHHmmss')}&details=${encodeURIComponent(selectedService?.name)}&location=${encodeURIComponent(salon.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-brand-primary text-white rounded-xl font-bold hover:opacity-90 transition-all"
            >
              <Calendar size={18} /> Adicionar ao Calendário
            </a>
            <a 
              href={`https://wa.me/?text=${encodeURIComponent(`Olá, acabei de agendar ${selectedService?.name} para ${moment(selectedDate).format('DD/MM')} às ${selectedTime}!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-xl font-bold hover:opacity-90 transition-all"
            >
              <Share2 size={18} /> Compartilhar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface transition-colors duration-300 pb-24 md:pb-0">
      {/* HERO SECTION */}
      <div className="relative h-48 md:h-64 bg-brand-secondary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        {salon.logo_url && (
           <img src={salon.logo_url} alt="Cover" className="w-full h-full object-cover opacity-50 blur-sm scale-110" />
        )}
        <div className="absolute bottom-0 left-0 p-6 z-20 w-full max-w-3xl mx-auto left-0 right-0">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{salon.name}</h1>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1"><MapPin size={14} /> {salon.address}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> Aberto agora</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 -mt-6 relative z-30">
        
        {/* STEPPER */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2 relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step >= s ? 'bg-brand-primary text-white scale-110' : 'bg-brand-card text-brand-muted border border-brand-muted/20'
              }`}>
                {s}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s ? 'text-brand-primary' : 'text-brand-muted'}`}>
                {s === 1 ? 'Serviço' : s === 2 ? 'Profissional' : 'Data'}
              </span>
            </div>
          ))}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-brand-muted/10 -z-0" />
          <div 
            className="absolute top-4 left-4 h-0.5 bg-brand-primary -z-0 transition-all duration-500" 
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%', right: step === 3 ? '1rem' : 'auto' }} 
          />
        </div>

        {/* STEP 1: SERVICES */}
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-brand-text mb-4">Selecione um Serviço</h2>
            <div className="grid grid-cols-1 gap-4">
              {services.map(service => (
                <div 
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep(2); }}
                  className="bg-brand-card p-4 rounded-2xl border border-brand-muted/20 hover:border-brand-primary cursor-pointer transition-all hover:shadow-md flex justify-between items-center group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-surface rounded-xl text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                      <Scissors size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-text">{service.name}</h3>
                      <p className="text-xs text-brand-muted">{service.duration} min • {service.description || 'Sem descrição'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-brand-primary">R$ {service.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: PROFESSIONALS */}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-text mb-2">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="text-xl font-bold text-brand-text mb-4">Escolha o Profissional</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {professionals.map(pro => (
                <div 
                  key={pro.id}
                  onClick={() => { setSelectedProfessional(pro); setStep(3); }}
                  className="bg-brand-card p-6 rounded-3xl border border-brand-muted/20 hover:border-brand-primary cursor-pointer transition-all hover:shadow-md flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 rounded-full bg-brand-surface mb-3 overflow-hidden border-2 border-transparent group-hover:border-brand-primary transition-colors">
                    {pro.avatar_url ? (
                      <img src={pro.avatar_url} alt={pro.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-4 text-brand-muted" />
                    )}
                  </div>
                  <h3 className="font-bold text-brand-text">{pro.name}</h3>
                  <p className="text-xs text-brand-muted">{pro.specialty || 'Especialista'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DATE & TIME */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-text mb-2">
              <ChevronLeft size={16} /> Voltar
            </button>
            
            {/* Date Picker */}
            <div>
              <h2 className="text-lg font-bold text-brand-text mb-3">Data</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {generateDates().map(date => {
                  const isSelected = date.format('YYYY-MM-DD') === selectedDate;
                  return (
                    <button
                      key={date.toString()}
                      onClick={() => setSelectedDate(date.format('YYYY-MM-DD'))}
                      className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${
                        isSelected 
                        ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' 
                        : 'bg-brand-card text-brand-muted border-brand-muted/20 hover:border-brand-primary/50'
                      }`}
                    >
                      <span className="text-xs font-medium uppercase">{date.format('ddd')}</span>
                      <span className="text-xl font-bold">{date.format('DD')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Grid */}
            <div>
              <h2 className="text-lg font-bold text-brand-text mb-3">Horário</h2>
              <div className="grid grid-cols-4 gap-3">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      selectedTime === time
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-brand-card text-brand-text border-brand-muted/20 hover:border-brand-primary/50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-brand-card p-4 rounded-2xl border border-brand-muted/20 mt-6">
              <h3 className="font-bold text-brand-text mb-3">Seus Dados</h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Seu Nome Completo"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
                <input 
                  type="tel" 
                  placeholder="Seu WhatsApp / Telefone"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE STICKY FOOTER */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-surface border-t border-brand-muted/10 z-40 md:relative md:border-none md:bg-transparent md:p-0 md:mt-8 md:max-w-3xl md:mx-auto">
          <button 
            onClick={handleBooking}
            disabled={!selectedTime || !clientName || !clientPhone || submitting}
            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
          </button>
        </div>
      )}
    </div>
  );
}