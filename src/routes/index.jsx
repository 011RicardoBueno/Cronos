import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSalon } from '../context/SalonContext';
import ToastNotifications from '../components/ui/ToastNotifications';
import { Loader2 } from 'lucide-react';

// --- GESTÃO E ADMINISTRAÇÃO ---
import BusinessDashboard from '../pages/dashboard/BusinessDashboard'; 
import Login from '../pages/Login';
import SalonSetup from '../components/salon/SalonSetup';
import Schedule from '../pages/agenda/Schedule'; // Antigo Agenda
import Services from '../pages/services/Services'; // Antigo Servicos
import Products from '../pages/products/Products'; // Antigo Produtos
import Professionals from '../pages/professionals/Professionals'; // Antigo Profissionais
import Settings from '../pages/admin/Settings'; // Antigo Configuracoes
import DashboardLayout from '../components/layout/DashboardLayout';
import ApiDocumentation from '../pages/admin/ApiDocumentation';
import PricingPage from '../pages/admin/PricingPage';
import MyAccount from '../pages/admin/MyAccount';
import Clients from '../pages/customers/Clients';
import QueueDisplay from '../pages/customers/QueueDisplay';

// --- FINANCEIRO ---
import CashFlow from '../pages/finance/CashFlow'; // Antigo FluxoCaixa
import Analytics from '../pages/finance/Analytics'; 
import Transactions from '../pages/finance/Transactions';
import ServicePerformance from '../pages/finance/ServicePerformance';

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
      <div className="flex flex-col justify-center items-center h-screen bg-brand-surface text-brand-muted">
        <Loader2 className="animate-spin text-brand-primary mb-4" size={32} />
        <p className="font-semibold">Carregando ecossistema...</p>
      </div>
    );
  }
  return (
    <>
      <ToastNotifications />
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
              {/* ADMIN LAYOUT (Dashboard + persistent sidebar) */}
              <Route element={<DashboardLayout />}>
                <Route index element={
                  user?.user_metadata?.role === 'client' 
                    ? <Navigate to="/agendamento-cliente" replace /> 
                    : <BusinessDashboard /> 
                } />

                {/* OPERACIONAL */}
                <Route path="agenda" element={<Schedule />} />
                <Route path="servicos" element={<Services />} />
                <Route path="produtos" element={<Products />} />
                <Route path="profissionais" element={<Professionals />} />
                <Route path="configuracoes" element={<Settings />} />
                <Route path="configuracoes/api" element={<ApiDocumentation />} />
                <Route path="planos" element={<PricingPage />} />
                <Route path="minha-conta" element={<MyAccount />} />
                
                {/* CLIENTES */}
                <Route path="admin/clientes" element={<Clients />} />
                <Route path="admin/painel-fila" element={<QueueDisplay />} />

                {/* FINANCEIRO */}
                <Route path="financeiro" element={<Navigate to="/analytics" replace />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="financeiro/servicos" element={<ServicePerformance />} />
                <Route path="financeiro/fluxo-caixa" element={<CashFlow />} />
                <Route path="financeiro/transacoes" element={<Transactions />} />
              </Route>

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
    </>
  );
};