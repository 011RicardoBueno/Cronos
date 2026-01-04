// src/components/ServicesSection.jsx
import React from "react";
import ServicesList from "./ServicesList";

export default function ServicesSection({ services, setServices, salonId, colors }) {
  return (
    <section
      className="bg-brand-card rounded-3xl p-8 border border-brand-muted/20"
    >
      <h2 className="text-2xl font-bold text-brand-text mb-6">
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
