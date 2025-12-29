import { Routes, Route, Navigate } from 'react-router-dom';
import Agenda from '../pages/agenda/Agenda';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';

export const AppRoutes = ({ session }) => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} 
      />
      <Route path="*" element={<Navigate to={session ? "/" : "/login"} />} />
      <Route path="/agenda" element={<Agenda session={session} />} />
    </Routes>
  );
};
