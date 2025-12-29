// src/components/ServicesSection.jsx
import React from "react";
import ServicesList from "./ServicesList";

export default function ServicesSection({ services, setServices, salonId, colors }) {
  return (
    <section
      style={{
        backgroundColor: colors.white,
        borderRadius: "16px",
        padding: "30px",
        border: `1px solid ${colors.warmSand}`,
      }}
    >
      <h2 style={{ color: colors.deepCharcoal, marginBottom: "20px" }}>
        Catálogo de Serviços
      </h2>

      <ServicesList
        services={services}
        setServices={setServices}
        salonId={salonId}
      />
    </section>
  );
}
