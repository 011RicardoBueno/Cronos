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
import PublicBookingPage from '../pages/public/PublicBookingPage'; // <-- Verifique se este arquivo existe neste caminho
import Clients from '../pages/admin/Clients';
import Financeiro from '../pages/financeiro/Financeiro';

export const AppRoutes = () => {
  const { session, loading: authLoading, user } = useAuth();
  const { loading: salonLoading, needsSetup } = useSalon();

  // 1. Tela de Carregamento
  if (authLoading || salonLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* --- ROTAS PÚBLICAS --- */}
      {/* Se já estiver logado, não faz sentido ver a tela de login, manda para a Home */}
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/p/:slug" element={<PublicBookingPage />} />

      {/* --- PROTEÇÃO: NÃO LOGADO --- */}
      {!session ? (
        <Route path="*" element={<Navigate to="/login" replace />} />
      ) : (
        /* --- USUÁRIO LOGADO --- */
        <>
          {/* Se for ADMIN e precisar de SETUP, fica preso no /setup */}
          {needsSetup && user?.user_metadata?.role === 'admin' ? (
            <>
              <Route path="/setup" element={<SalonSetup />} />
              <Route path="*" element={<Navigate to="/setup" replace />} />
            </>
          ) : (
            /* --- ROTAS DO SISTEMA (LOGADO E CONFIGURADO) --- */
            <>
              {/* Home redireciona conforme o perfil */}
              <Route path="/" element={
                user?.user_metadata?.role === 'client' 
                ? <Navigate to="/agendamento-cliente" replace /> 
                : <Dashboard />
              } />

              {/* Rotas Administrativas */}
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/profissionais" element={<Profissionais />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/admin/clientes" element={<Clients />} />
              <Route path="/financeiro" element={<Financeiro />} />

              {/* Rotas do Cliente */}
              <Route path="/agendamento-cliente" element={<Explorer />} />
              <Route path="/agendar/:id" element={<SalonBooking />} />
              <Route path="/meus-agendamentos" element={<MyAppointments />} />

              {/* Se tentar acessar /setup já estando configurado, volta pra Home */}
              <Route path="/setup" element={<Navigate to="/" replace />} />
              
              {/* Fallback para rotas inexistentes dentro do login */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </>
      )}
    </Routes>
  );
};