import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from "../../lib/supabase";
import { COLORS } from '../../constants/dashboard';
import { Search, Calendar, LogOut } from 'lucide-react';

const ClientHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair?")) {
      await supabase.auth.signOut();
      navigate("/login");
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.navGroup}>
        <Link to="/agendamento-cliente" style={styles.link}>
          <Search size={18} />
          <span>Explorar</span>
        </Link>
        <Link to="/meus-agendamentos" style={styles.link}>
          <Calendar size={18} />
          <span>Meus Agendamentos</span>
        </Link>
      </div>

      <button onClick={handleLogout} style={styles.logoutBtn}>
        <LogOut size={18} />
      </button>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginBottom: '20px',
    borderRadius: '0 0 16px 16px'
  },
  navGroup: {
    display: 'flex',
    gap: '20px'
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: COLORS.deepCharcoal,
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#e74c3c',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    alignItems: 'center'
  }
};

export default ClientHeader;