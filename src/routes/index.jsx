import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSalon } from '../context/SalonContext';

// Importações de Páginas
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import SalonSetup from '../components/salon/SalonSetup';
import Agenda from '../pages/agenda/Agenda';
import Servicos from '../pages/servicos/Servicos';
import Profissionais from '../pages/profissionais/Profissionais';
import Configuracoes from '../pages/configuracoes/Configuracoes';
import Explorer from '../pages/client/Explorer'; 
import SalonBooking from '../pages/client/SalonBooking';
import MyAppointments from '../pages/client/MyAppointments'; // Nova Importação
import PublicBookingPage from '../pages/public/PublicBookingPage';

export const AppRoutes = () => {
  const { session, loading: authLoading, user } = useAuth();
  const { loading: salonLoading, needsSetup } = useSalon();

  // 1. ROTAS TOTALMENTE PÚBLICAS (Link da Bio / Público)
  // Nota: Mantemos o check de pathname para garantir prioridade total
  if (window.location.pathname.startsWith('/p/')) {
    return (
      <Routes>
        <Route path="/p/:slug" element={<PublicBookingPage />} />
      </Routes>
    );
  }

  if (authLoading || salonLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Carregando...
      </div>
    );
  }

  // 2. SE NÃO ESTÁ LOGADO
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const userRole = user?.user_metadata?.role;

  // --- FLUXO DO CLIENTE LOGADO (App do Usuário) ---
  if (userRole === 'client') {
    return (
      <Routes>
        <Route path="/agendamento-cliente" element={<Explorer />} />
        <Route path="/agendar/:id" element={<SalonBooking />} />
        <Route path="/meus-agendamentos" element={<MyAppointments />} /> {/* Nova Rota */}
        <Route path="*" element={<Navigate to="/agendamento-cliente" replace />} />
      </Routes>
    );
  }

  // --- FLUXO DO ADMIN (DONO DE SALÃO) ---
  if (needsSetup) {
    return (
      <Routes>
        <Route path="/setup" element={<SalonSetup />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/servicos" element={<Servicos />} />
      <Route path="/profissionais" element={<Profissionais />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
      {/* Opcional: Permitir que o admin também veja seus próprios agendamentos se ele tiver o papel de cliente também */}
      <Route path="/meus-agendamentos" element={<MyAppointments />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};