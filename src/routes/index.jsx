import Servicos from '../pages/servicos/Servicos';
import { Routes, Route, Navigate } from 'react-router-dom';
import Agenda from '../pages/agenda/Agenda';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import { SalonProvider } from '../context/SalonContext'; // Verifique se o caminho está correto

export const AppRoutes = ({ session }) => {
  return (
    <Routes>
      {/* Rota Pública */}
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />

      {/* Rotas Privadas (Protegidas pelo SalonProvider) */}
      <Route
        path="/*"
        element={
          session ? (
            <SalonProvider session={session}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agenda" element={<Agenda session={session} />} />
                <Route path="/servicos" element={<Servicos />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </SalonProvider>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
};