import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SalonProvider } from './context/SalonContext';
import { AppRoutes } from './routes';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SalonProvider>
          <AppRoutes />
        </SalonProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
