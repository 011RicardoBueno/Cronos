import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { SalonProvider } from '@/context/SalonContext';
import { AppRoutes } from '@/routes';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SalonProvider>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--brand-card)',
                color: 'var(--brand-text)',
                border: '1px solid var(--brand-muted-10)',
                borderRadius: '1rem',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--brand-primary)',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444', // red-500
                  secondary: 'white',
                },
              },
            }}
          />
          <AppRoutes />
        </SalonProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
