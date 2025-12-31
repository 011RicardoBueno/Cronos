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
import MyAppointments from '../pages/client/MyAppointments';
import PublicBookingPage from '../pages/public/PublicBookingPage';
import Clients from '../pages/admin/Clients';
import Financeiro from '../pages/financeiro/Financeiro';

export const AppRoutes = () => {
  const { session, loading: authLoading, user } = useAuth();
  const { loading: salonLoading, needsSetup } = useSalon();

  if (authLoading || salonLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Carregando...
      </div>
    );
  }

  return (
    <Routes>
      {/* 1. ROTAS PÚBLICAS (Sempre acessíveis) */}
      <Route path="/p/:slug" element={<PublicBookingPage />} />
      <Route path="/login" element={<Login />} />

      {/* 2. PROTEÇÃO DE ROTAS LOGADAS */}
      {!session ? (
        // Se não está logado e tenta acessar qualquer coisa que não seja público, vai pro Login
        <Route path="*" element={<Navigate to="/login" replace />} />
      ) : (
        // USUÁRIO LOGADO
        <>
          {needsSetup ? (
            <Route path="*" element={<Navigate to="/setup" replace />} />
          ) : (
            <>
              {/* Rotas Comuns ou de Admin */}
              <Route path="/" element={user?.user_metadata?.role === 'client' ? <Navigate to="/agendamento-cliente" /> : <Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/profissionais" element={<Profissionais />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/meus-agendamentos" element={<MyAppointments />} />
              <Route path="/admin/clientes" element={<Clients />} />
              <Route path="/financeiro" element={<Financeiro />} />

              {/* Rotas exclusivas de Cliente */}
              <Route path="/agendamento-cliente" element={<Explorer />} />
              <Route path="/agendar/:id" element={<SalonBooking />} />
            </>
          )}
          
          {/* Rota de Setup */}
          <Route path="/setup" element={<SalonSetup />} />
        </>
      )}

      {/* Fallback Geral */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};