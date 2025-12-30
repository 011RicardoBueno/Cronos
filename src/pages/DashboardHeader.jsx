import React from 'react';

const DashboardHeader = ({ salonName, todaySlotsCount, colors, upcomingFeatures = [] }) => {
  // 1. Definimos o theme aqui para evitar erros de "theme is not defined"
  const theme = {
    text: colors?.deepCharcoal || "#333",
    subtext: colors?.mutedTaupe || "#666",
    accent: colors?.warmSand || "#f3eee a"
  };

  return (
    <header style={{ marginBottom: "30px" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <div>
          <h1 style={{ 
            fontSize: "28px", 
            fontWeight: "bold", 
            color: theme.text,
            margin: 0 
          }}>
            {salonName || "Carregando..."}
          </h1>
          <p style={{ color: theme.subtext, marginTop: "5px" }}>
            {todaySlotsCount > 0 
              ? `Você tem ${todaySlotsCount} agendamentos hoje.` 
              : "Bem-vindo ao seu painel de controle."}
          </p>
        </div>

        {/* 2. Bloco de Features corrigido e sem duplicação */}
        {upcomingFeatures && upcomingFeatures.length > 0 && (
          <div style={{ 
            backgroundColor: theme.accent, 
            padding: "8px 15px", 
            borderRadius: "10px",
            fontSize: "13px",
            maxWidth: "350px",
            color: theme.text,
            border: `1px solid ${colors?.warmSand || 'transparent'}`
          }}>
            <strong>Em breve:</strong> { JSON.stringify(upcomingFeatures) }
          </div>
        )}
      </div>
      <hr style={{ border: `0.5px solid ${theme.accent}`, marginTop: "20px" }} />
    </header>
  );
};

export default DashboardHeader;