import { Routes, Route, Navigate } from 'react-router-dom';
import { SalonProvider } from '../context/SalonContext';
import Dashboard from '../pages/Dashboard';
import Agenda from '../pages/agenda/Agenda';
import Servicos from '../pages/servicos/Servicos';
import Login from '../pages/Login';

export const AppRoutes = ({ session }) => {
  // Pegamos a role dos metadados que salvamos no SignUp
  const userRole = session?.user?.user_metadata?.role || 'client';

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />

      <Route
        path="/*"
        element={
          session ? (
            userRole === 'admin' ? (
              /* Fluxo do Dono do Salão */
              <SalonProvider>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/servicos" element={<Servicos />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </SalonProvider>
            ) : (
              /* Fluxo do Cliente Final */
              <Routes>
                <Route path="/" element={<div>Página de Agendamento do Cliente (Em breve)</div>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
};