import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAppointmentsByClientId } from '@/services/supabaseService';
import { Link } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/pt-br';
import ClientHeader from '@/components/ui/ClientHeader';
import { Calendar, Clock, Loader2, User, Building } from 'lucide-react';

moment.locale('pt-br');

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Usuário não autenticado. Por favor, faça login para ver seus agendamentos.");
        }
        const userAppointments = await fetchAppointmentsByClientId(user.id);
        setAppointments(userAppointments);
      } catch (err) {
        console.error("Erro ao carregar agendamentos:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, []);

  const upcomingAppointments = appointments.filter(a => moment(a.start_time).isAfter(moment()));
  const pastAppointments = appointments.filter(a => moment(a.start_time).isBefore(moment()));

  const AppointmentCard = ({ slot }) => (
    <div className="bg-brand-card p-5 rounded-2xl border border-brand-muted/10 shadow-sm transition-all hover:shadow-lg hover:border-brand-primary/20">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="font-black text-brand-text text-lg">{slot.services.name}</p>
          <Link to={`/booking/${slot.salons.slug}`} className="flex items-center gap-2 text-sm text-brand-muted mt-1 hover:text-brand-primary transition-colors">
            <Building size={14} />
            <span className="font-semibold">{slot.salons.name}</span>
          </Link>
        </div>
        <span className="text-brand-primary font-extrabold text-lg whitespace-nowrap">R$ {Number(slot.services.price).toFixed(2)}</span>
      </div>
      <div className="mt-4 pt-4 border-t border-brand-surface space-y-3 text-sm">
        <div className="flex items-center gap-3 text-brand-muted">
          <Calendar size={16} className="text-brand-primary" />
          <span className="font-medium">{moment(slot.start_time).format('dddd, D [de] MMMM [de] YYYY')}</span>
        </div>
        <div className="flex items-center gap-3 text-brand-muted">
          <Clock size={16} className="text-brand-primary" />
          <span className="font-medium">{moment(slot.start_time).format('HH:mm')}</span>
        </div>
        <div className="flex items-center gap-3 text-brand-muted">
          <User size={16} className="text-brand-primary" />
          <span className="font-medium">Com {slot.professionals.name}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-brand-surface min-h-screen">
        <ClientHeader />
        <div className="text-center p-20 flex flex-col items-center justify-center text-brand-muted">
          <Loader2 className="animate-spin text-brand-primary mb-4" size={32} />
          <p className="font-semibold">Carregando seus agendamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface min-h-screen">
      <ClientHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in duration-500">
        <h1 className="text-3xl font-black text-brand-text tracking-tight mb-8">Meus Agendamentos</h1>
        
        {error && <p className="text-center p-12 text-red-500 bg-red-500/10 rounded-2xl">{error}</p>}

        {!error && (
          <>
            <section>
              <h2 className="text-xl font-bold text-brand-text mb-4">Próximos</h2>
              {upcomingAppointments.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {upcomingAppointments.map(slot => <AppointmentCard key={slot.id} slot={slot} />)}
                </div>
              ) : (
                <div className="text-brand-muted text-center py-10 bg-brand-card rounded-2xl border border-dashed border-brand-muted/10"><p>Você não tem agendamentos futuros.</p></div>
              )}
            </section>

            <section className="mt-12">
              <h2 className="text-xl font-bold text-brand-text mb-4">Anteriores</h2>
              {pastAppointments.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {pastAppointments.map(slot => <AppointmentCard key={slot.id} slot={slot} />)}
                </div>
              ) : (
                <div className="text-brand-muted text-center py-10 bg-brand-card rounded-2xl border border-dashed border-brand-muted/10"><p>Nenhum agendamento anterior encontrado.</p></div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}