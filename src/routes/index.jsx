import SalonBooking from '../pages/client/SalonBooking';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSalon } from '../context/SalonContext';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import SalonSetup from '../components/salon/SalonSetup';
import Agenda from '../pages/agenda/Agenda';
import Servicos from '../pages/servicos/Servicos';
import Profissionais from '../pages/profissionais/Profissionais';
import Configuracoes from '../pages/configuracoes/Configuracoes';
import Explorer from '../pages/client/Explorer'; // Importe o Explorer

export const AppRoutes = () => {
  const { session, loading: authLoading, user } = useAuth();
  const { loading: salonLoading, needsSetup } = useSalon();

  if (authLoading || salonLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Pega a role do metadado do usuário
  const userRole = user?.user_metadata?.role;

  // --- FLUXO DO CLIENTE ---
if (userRole === 'client') {
  return (
    <Routes>
      <Route path="/agendamento-cliente" element={<Explorer />} />
      <Route path="/agendar/:id" element={<SalonBooking />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};