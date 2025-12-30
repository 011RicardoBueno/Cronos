import React from 'react';
import { supabase } from "../../lib/supabase";

const DashboardHeader = ({ salonName, todaySlotsCount, colors, upcomingFeatures = [] }) => {
  
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
    text: colors?.deepCharcoal || "#333",
    subtext: colors?.mutedTaupe || "#666",
    accent: colors?.warmSand || "#f3eee7",
    danger: "#e74c3c"
  };

  return (
    <header style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h1 style={{ fontSize: "24px", color: theme.text, margin: 0 }}>
          {salonName || "Carregando..."}
        </h1>
        <p style={{ color: theme.subtext, margin: "5px 0 0 0" }}>
          {todaySlotsCount > 0 ? `Hoje: ${todaySlotsCount} agendamentos` : "Bem-vindo ao Cronos"}
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
          fontWeight: '500'
        }}
      >
        Sair
      </button>
    </header>
  );
};

// ESTA LINHA É A QUE ESTAVA FALTANDO E CAUSANDO O ERRO NO VITE
export default DashboardHeader;