import React from "react";

export default function DashboardHeader({
  salonName,
  todaySlotsCount,
  colors,
  selectedProfessionalId,
  setSelectedProfessionalId,
  professionals = [],
  upcomingFeatures = [], // Novidade: lista de futuras funções
}) {
  return (
    <header style={{ marginBottom: "30px", textAlign: "center" }}>
      {/* Nome do salão */}
      <h1 style={{ color: colors.deepCharcoal, fontSize: "2.5rem", fontWeight: 300 }}>
        {salonName}
      </h1>

      {/* Agendamentos de hoje */}
      <p style={{ color: colors.deepCharcoal }}>
        Hoje: <strong>{todaySlotsCount}</strong> agendamento{todaySlotsCount !== 1 ? "s" : ""}
      </p>

      {/* Filtro de profissionais (pills) */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: "15px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setSelectedProfessionalId("all")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: selectedProfessionalId === "all" ? colors.sageGreen : colors.warmSand,
            color: selectedProfessionalId === "all" ? "white" : colors.deepCharcoal,
            fontWeight: 500,
          }}
        >
          Todos
        </button>

        {professionals.map((pro) => (
          <button
            key={pro.id}
            onClick={() => setSelectedProfessionalId(pro.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: selectedProfessionalId === pro.id ? colors.sageGreen : colors.warmSand,
              color: selectedProfessionalId === pro.id ? "white" : colors.deepCharcoal,
              fontWeight: 500,
            }}
          >
            {pro.name}
          </button>
        ))}
      </div>

      {/* Futuras funcionalidades */}
      {upcomingFeatures.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          {upcomingFeatures.map((feature) => (
            <div
              key={feature.name}
              style={{
                padding: "6px 12px",
                borderRadius: "12px",
                backgroundColor: colors.dustyRose,
                color: colors.deepCharcoal,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
              title={feature.description}
            >
              {feature.name}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
