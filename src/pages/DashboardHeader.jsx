import React from 'react';

const DashboardHeader = ({ salonName, todaySlotsCount, colors, upcomingFeatures = [] }) => {
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
            border: "5px solid red"
            fontSize: "28px", 
            fontWeight: "bold", 
            color: colors.deepCharcoal,
            margin: 0 
          }}>
            {salonName || "Carregando..."}
          </h1>
          <p style={{ color: colors.mutedTaupe, marginTop: "5px" }}>
            {todaySlotsCount > 0 
              ? `Você tem ${todaySlotsCount} agendamentos hoje.` 
              : "Nenhum agendamento para hoje até o momento."}
          </p>
        </div>

        {upcomingFeatures.length > 0 && (
          <div style={{ 
            backgroundColor: colors.warmSand, 
            padding: "10px 15px", 
            borderRadius: "12px",
            fontSize: "14px"
          }}>
            <strong>Novidades em breve:</strong> {upcomingFeatures.join(", ")}
          </div>
        )}
      </div>
      <hr style={{ border: `0.5px solid ${colors.warmSand}`, marginTop: "20px" }} />
    </header>
  );
};

export default DashboardHeader;