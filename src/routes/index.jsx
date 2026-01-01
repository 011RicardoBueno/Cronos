import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSalon } from '../context/SalonContext';

// --- GESTÃO E ADMINISTRAÇÃO ---
import BusinessDashboard from '../pages/dashboard/BusinessDashboard'; 
import Login from '../pages/Login';
import SalonSetup from '../components/salon/SalonSetup';
import Schedule from '../pages/agenda/Schedule'; // Antigo Agenda
import Services from '../pages/services/Services'; // Antigo Servicos
import Products from '../pages/products/Products'; // Antigo Produtos
import Professionals from '../pages/professionals/Professionals'; // Antigo Profissionais
import Settings from '../pages/settings/Settings'; // Antigo Configuracoes
import Clients from '../pages/customers/Clients';
import QueueDisplay from '../pages/customers/QueueDisplay';

// --- FINANCEIRO ---
import CashFlow from '../pages/finance/CashFlow'; // Antigo FluxoCaixa
import Analytics from '../pages/finance/Analytics'; 

// --- CLIENTE LOGADO ---
import Explorer from '../pages/client/Explorer'; 
import SalonBooking from '../pages/client/SalonBooking';
import MyAppointments from '../pages/client/MyAppointments';

// --- PÁGINAS PÚBLICAS ---
import PublicBookingPage from '../pages/public/PublicBookingPage'; 
import Feedback from '../pages/public/Feedback';

export const AppRoutes = () => {
  const { session, loading: authLoading, user } = useAuth();
  const { loading: salonLoading, needsSetup } = useSalon();

  if (authLoading || salonLoading) {
    return (
      <div style={styles.loader}>
        <p>Carregando ecossistema...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* ROTA DE LOGIN */}
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
      
      {/* ROTAS PÚBLICAS */}
      <Route path="/p/:slug" element={<PublicBookingPage />} />
      <Route path="/avaliar/:slotId" element={<Feedback />} />

      {!session ? (
        <Route path="*" element={<Navigate to="/login" replace />} />
      ) : (
        <>
          {/* SETUP INICIAL */}
          {needsSetup && user?.user_metadata?.role === 'admin' ? (
            <>
              <Route path="/setup" element={<SalonSetup />} />
              <Route path="*" element={<Navigate to="/setup" replace />} />
            </>
          ) : (
            <>
              {/* HOME / DASHBOARD */}
              <Route path="/" element={
                user?.user_metadata?.role === 'client' 
                ? <Navigate to="/agendamento-cliente" replace /> 
                : <BusinessDashboard /> 
              } />

              {/* OPERACIONAL */}
              <Route path="/agenda" element={<Schedule />} />
              <Route path="/servicos" element={<Services />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/profissionais" element={<Professionals />} />
              <Route path="/configuracoes" element={<Settings />} />
              
              {/* CLIENTES */}
              <Route path="/admin/clientes" element={<Clients />} />
              <Route path="/admin/painel-fila" element={<QueueDisplay />} />

              {/* FINANCEIRO */}
              <Route path="/financeiro" element={<CashFlow />} />
              <Route path="/analytics" element={<Analytics />} />

              {/* ÁREA DO CLIENTE */}
              <Route path="/agendamento-cliente" element={<Explorer />} />
              <Route path="/agendar/:id" element={<SalonBooking />} />
              <Route path="/meus-agendamentos" element={<MyAppointments />} />

              {/* FALLBACKS */}
              <Route path="/setup" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </>
      )}
    </Routes>
  );
};

const styles = {
  loader: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    fontFamily: 'sans-serif',
    backgroundColor: '#f9f9f9',
    color: '#666'
  }
};