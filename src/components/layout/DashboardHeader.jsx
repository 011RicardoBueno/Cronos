import React from 'react';

const DashboardHeader = ({ 
  salonName = "Carregando...", 
  todaySlotsCount = 0, 
  colors, 
  upcomingFeatures = [] 
}) => {
  // Verificação de segurança para as cores
  const theme = {
    text: colors?.deepCharcoal || "#333",
    subtext: colors?.mutedTaupe || "#666",
    accent: colors?.warmSand || "#f3eee a"
  };

  return (
    <header style={{ marginBottom: "30px", borderBottom: `1px solid ${theme.accent}`, paddingBottom: "20px" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start",
        gap: "20px"
      }}>
        <div>
          <h1 style={{ fontSize: "28px", color: theme.text, margin: 0 }}>
            {salonName}
          </h1>
          <p style={{ color: theme.subtext, marginTop: "5px" }}>
            {todaySlotsCount > 0 
              ? `Você tem ${todaySlotsCount} agendamentos hoje.` 
              : "Bem-vindo ao seu painel de controle."}
          </p>
        </div>

        {upcomingFeatures.length > 0 && (
          <div style={{ 
            backgroundColor: theme.accent, 
            padding: "8px 15px", 
            borderRadius: "10px",
            fontSize: "13px",
            maxWidth: "250px"
          }}>
            <strong>Em breve:</strong> {upcomingFeatures.join(", ")}
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;