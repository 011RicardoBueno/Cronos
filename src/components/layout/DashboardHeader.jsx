import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../../lib/supabase";
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import { LogOut, Monitor } from 'lucide-react';

const DashboardHeader = () => {
  const { salon, loading } = useSalon();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair?")) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erro ao sair:", error.message);
      } else {
        navigate('/');
      }
    }
  };

  const openQueueDisplay = () => {
    window.open('/admin/painel-fila', '_blank');
  };

  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>
          {loading ? "Carregando..." : (salon?.name || "Bem-vindo!")}
        </h1>
        <p style={styles.subtitle}>
          {salon ? "Painel Administrativo" : "Carregando configurações..."}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={openQueueDisplay}
          style={styles.tvButton}
          title="Abrir Painel de Fila para TV"
        >
          <Monitor size={18} />
          Painel TV
        </button>

        <button onClick={handleLogout} style={styles.logoutButton}>
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: { marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" },
  title: { fontSize: "24px", color: COLORS.deepCharcoal, margin: 0, fontWeight: '800' },
  subtitle: { color: "#666", margin: "5px 0 0 0", fontSize: '0.9rem' },
  tvButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
    backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: COLORS.deepCharcoal,
    borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s'
  },
  logoutButton: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
    backgroundColor: 'transparent', border: `1px solid #fee2e2`, color: '#ef4444',
    borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s'
  }
};

export default DashboardHeader;