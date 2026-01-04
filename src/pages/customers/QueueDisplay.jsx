import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { Clock, Scissors, Star } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import moment from 'moment';
import 'moment/locale/pt-br';

export default function QueueDisplay() {
  const { professionals, salon } = useSalon();
  const [queue, setQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(moment().format('HH:mm:ss'));

  const bookingUrl = salon?.slug 
    ? `https://fluxo.com/p/${salon.slug}` 
    : "https://fluxo.com";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment().format('HH:mm:ss')), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!professionals?.length) return;

    const fetchQueue = async () => {
      const startOfDay = moment().startOf('day').toISOString();
      const { data } = await supabase
        .from('slots')
        .select(`id, start_time, client_name, status, services(name), professionals(name)`)
        .in('professional_id', professionals.map(p => p.id))
        .neq('status', 'cancelled')
        .neq('status', 'completed')
        .gte('start_time', startOfDay)
        .lte('start_time', moment().endOf('day').toISOString())
        .order('start_time', { ascending: true });

      setQueue(data || []);
    };

    fetchQueue();

    const channel = supabase
      .channel('queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => fetchQueue())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [professionals]);

  return (
    <div className="min-h-screen bg-brand-surface p-8 font-sans overflow-hidden">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-slow { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
      `}</style>

      <header className="flex justify-between items-center mb-12 bg-brand-card p-8 rounded-[2rem] shadow-lg border border-brand-muted/10">
        <div className="flex items-center gap-6">
          {salon?.logo_url && (
            <img src={salon.logo_url} alt="Logo" className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
          )}
          <div>
            <h1 className="text-4xl font-black text-brand-text tracking-tight m-0">{salon?.name || 'Carregando...'}</h1>
            <div className="flex items-center gap-2 text-brand-primary mt-1">
              <Star size={20} fill="currentColor" />
              <span className="text-lg font-bold">Painel de Atendimento em Tempo Real</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 px-8 py-4 rounded-3xl bg-brand-surface border border-brand-muted/10">
          <Clock size={32} className="text-brand-primary" />
          <span className="text-4xl font-black text-brand-text tabular-nums">{currentTime}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {queue.length > 0 ? (
          <div className="grid gap-6">
            {queue.slice(0, 5).map((item, index) => (
              <div key={item.id} 
                className={`flex items-center p-10 rounded-[2.5rem] shadow-sm transition-all duration-500 border-l-[16px] ${
                  index === 0 
                    ? 'bg-brand-primary/5 border-brand-primary scale-[1.02] shadow-xl' 
                    : 'bg-brand-card border-brand-muted/20 scale-100'
                }`}
                style={{
                  animation: `fadeIn ${0.3 + index * 0.1}s ease-out forwards`,
                  opacity: 0 // Initial state for animation
                }}
              >
                <div className="min-w-[180px] text-center">
                  <span className="text-6xl font-black text-brand-text leading-none block">
                    {moment(item.start_time).format('HH:mm')}
                  </span>
                  {index === 0 && (
                    <span className="bg-brand-primary text-white px-4 py-1.5 rounded-xl text-sm font-bold inline-block mt-3 tracking-wider">
                      A SEGUIR
                    </span>
                  )}
                </div>
                
                <div className="ml-16">
                  <h2 className="text-5xl font-extrabold text-brand-text mb-2 tracking-tight">
                    {item.client_name || 'Próximo Cliente'}
                  </h2>
                  <p className="text-3xl text-brand-muted flex items-center gap-4">
                    <Scissors size={28} className="text-brand-primary" />
                    <span>{item.services?.name}</span>
                    <span className="w-2 h-2 rounded-full bg-brand-muted/30" />
                    <span className="font-bold text-brand-text">{item.professionals?.name}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="text-center animate-[fadeIn_1s_ease-out]">
              <h2 className="text-6xl font-black text-brand-text mb-2 tracking-tight">Sua vez está chegando!</h2>
              <p className="text-2xl text-brand-muted mb-10 font-medium">Escaneie para agendar seu próximo horário</p>
              
              <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl inline-block animate-[pulse-slow_3s_infinite]">
                <QRCodeSVG 
                  value={bookingUrl} 
                  size={320}
                  level={"H"}
                  includeMargin={true}
                  imageSettings={salon?.logo_url ? {
                    src: salon.logo_url,
                    height: 60,
                    width: 60,
                    excavate: true,
                  } : undefined}
                />
              </div>
              <p className="mt-8 text-3xl font-black text-brand-primary tracking-wide">{bookingUrl.replace('https://', '')}</p>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 bg-brand-card border-t border-brand-muted/10 text-brand-muted text-xl font-medium text-center">
        <div className="flex justify-center items-center gap-8">
          <span>Agendamentos Online: <strong className="text-brand-text">{bookingUrl.replace('https://', '')}</strong></span>
          <span className="opacity-30">|</span>
          <span>Siga-nos no Instagram</span>
        </div>
      </footer>
    </div>
  );
}