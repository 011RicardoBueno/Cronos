import ProfessionalCalendar from "./ProfessionalCalendar";
import ProfessionalSlotForm from "./ProfessionalSlotForm";

export default function ProfessionalAgendaCard({
  professional,
  services,
  slots,
  setSlotsByProfessional,
  loadDashboardData,
  handleDeleteSlot,
  handleMoveSlot,
  colors,
}) {
  return (
    <section
      style={{
        backgroundColor: colors.white,
        borderRadius: "16px",
        padding: "30px",
        marginBottom: "40px",
        border: `1px solid ${colors.warmSand}`,
      }}
    >
      <h2 style={{ color: colors.deepCharcoal, marginBottom: "20px" }}>
        Agenda: <strong>{professional.name}</strong>
      </h2>

      <ProfessionalSlotForm
        services={services}
        professionalId={professional.id}
        setSlotsByProfessional={setSlotsByProfessional}
        colors={colors}
        onSlotCreated={loadDashboardData}
      />

      <ProfessionalCalendar
        slots={slots}
        professionalId={professional.id}
        handleDeleteSlot={handleDeleteSlot}
        handleMoveSlot={handleMoveSlot}
      />
    </section>
  );
}
