// src/components/ProfessionalsSection.jsx
import React from "react";
import ProfessionalSlotForm from "./ProfessionalSlotForm";
import ProfessionalCalendar from "./ProfessionalCalendar";

export default function ProfessionalsSection({
  professionals,
  selectedProfessionalId,
  services,
  slotsByProfessional,
  setSlotsByProfessional,
  handleDeleteSlot,
  handleMoveSlot,
  colors
}) {
  const professionalsToRender =
    selectedProfessionalId === "all"
      ? professionals
      : professionals.filter(p => p.id === selectedProfessionalId);

  return (
    <>
      {professionalsToRender.map(pro => (
        <section
          key={pro.id}
          style={{
            backgroundColor: colors.white,
            borderRadius: "16px",
            padding: "30px",
            marginBottom: "40px",
            border: `1px solid ${colors.warmSand}`,
          }}
        >
          <h2 style={{ color: colors.deepCharcoal, marginBottom: "20px" }}>
            Agenda: <strong>{pro.name}</strong>
          </h2>

          <ProfessionalSlotForm
            professionalId={pro.id}
            services={services}
            slotsByProfessional={slotsByProfessional}
            setSlotsByProfessional={setSlotsByProfessional}
            colors={colors}
          />

          <ProfessionalCalendar
            slots={slotsByProfessional[pro.id] || []}
            professionalId={pro.id}
            handleDeleteSlot={handleDeleteSlot}
            handleMoveSlot={handleMoveSlot}
          />
        </section>
      ))}
    </>
  );
}
