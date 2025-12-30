import React from 'react';
import { supabase } from "../../lib/supabase";
import { useSalon } from '../../context/SalonContext'; // Importe o contexto
import { COLORS } from '../../constants/dashboard'; // Importe suas cores constantes

const DashboardHeader = () => {
  const { salon, loading } = useSalon(); // Pegue os dados direto daqui

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair?")) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erro ao sair:", error.message);
      } else {
        window.location.href = "/";
      }
    }
  };

  const theme = {
    text: COLORS?.deepCharcoal || "#333",
    subtext: "#666",
    danger: "#e74c3c"
  };

  return (
    <header style={{ 
      marginBottom: "30px", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      padding: "10px 0" 
    }}>
      <div>
        <h1 style={{ fontSize: "24px", color: theme.text, margin: 0 }}>
          {loading ? "Carregando..." : (salon?.name || "Bem-vindo!")}
        </h1>
        <p style={{ color: theme.subtext, margin: "5px 0 0 0" }}>
          {salon ? "Painel Administrativo" : "Carregando configurações..."}
        </p>
      </div>

      <button 
        onClick={handleLogout}
        style={{
          padding: '8px 16px',
          backgroundColor: 'transparent',
          border: `1px solid ${theme.danger}`,
          color: theme.danger,
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = theme.danger;
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = theme.danger;
        }}
      >
        Sair
      </button>
    </header>
  );
};

export default DashboardHeader;