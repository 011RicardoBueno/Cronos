// src/components/layout/DashboardHeader.jsx
import React from "react";

export default function DashboardHeader({
  salon,
  todaySlotsCount,
  professionals,
  selectedProfessionalId,
  setSelectedProfessionalId,
  colors
}) {
  return (
    <header style={{ marginBottom: "30px", textAlign: "center" }}>
      <h1 style={{ color: colors.deepCharcoal, fontSize: "2.5rem", fontWeight: 300 }}>
        {salon.name}
      </h1>
      <p style={{ color: colors.deepCharcoal }}>
        Hoje: <strong>{todaySlotsCount}</strong> agendamento{todaySlotsCount !== 1 ? "s" : ""}
      </p>

      {/* Pills de filtro */}
      <div style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: "20px"
      }}>
        <button
          onClick={() => setSelectedProfessionalId("all")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: selectedProfessionalId === "all" ? colors.sageGreen : colors.warmSand,
            color: selectedProfessionalId === "all" ? "white" : colors.deepCharcoal,
            fontWeight: 500
          }}
        >
          Todos
        </button>

        {professionals.map(pro => (
          <button
            key={pro.id}
            onClick={() => setSelectedProfessionalId(pro.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: selectedProfessionalId === pro.id ? colors.sageGreen : colors.warmSand,
              color: selectedProfessionalId === pro.id ? "white" : colors.deepCharcoal,
              fontWeight: 500
            }}
          >
            {pro.name}
          </button>
        ))}
      </div>
    </header>
  );
}
