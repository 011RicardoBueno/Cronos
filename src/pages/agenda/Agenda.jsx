import React, { useEffect } from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useProfessionalSlots } from '../../hooks/useProfessionalSlots';
import { useProfessionalFilter } from '../../hooks/useProfessionalFilter';
import { deleteSlot, updateSlotTime } from '../../services/supabaseService';
import { getTodaySlotsCount } from '../../utils/dashboardUtils';
import { COLORS } from '../../constants/dashboard';
import ProfessionalsSection from '../../components/ProfessionalsSection';

export default function Agenda({ session }) {
  const { selectedProfessionalId, setSelectedProfessionalId } = useProfessionalFilter("all");

  const {
    salon,
    services,
    professionals,
    loading,
    error,
    loadData,
    setServices = () => {}
  } = useDashboardData(session, selectedProfessionalId);

  const {
    slotsByProfessional,
    loadingSlots,
    loadProfessionalSlots,
    updateSlotsAfterDelete,
    updateSlotsAfterMove,
    setSlotsByProfessional
  } = useProfessionalSlots();

  useEffect(() => {
    if (professionals && professionals.length > 0) {
      loadProfessionalSlots(professionals);
    }
  }, [professionals, loadProfessionalSlots]);

  const handleDeleteSlot = async (slotId, profId) => {
    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;
    try {
      await deleteSlot(slotId);
      updateSlotsAfterDelete(profId, slotId);
    } catch (err) {
      alert("Erro ao cancelar: " + err.message);
    }
  };

  const handleMoveSlot = async ({ slotId, professionalId, newStart }) => {
    try {
      await updateSlotTime(slotId, newStart);
      updateSlotsAfterMove(professionalId, slotId, newStart.toISOString());
    } catch (err) {
      alert("Erro ao mover agendamento: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Carregando agenda...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "red" }}>{error}</div>;
  if (!salon) return <div style={{ padding: 40 }}>Salão não encontrado</div>;

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <h1 style={{ color: COLORS.deepCharcoal, textAlign: 'center', marginBottom: 20 }}>
          Agenda de {salon.name}
        </h1>

        <ProfessionalsSection
          professionals={professionals}
          selectedProfessionalId={selectedProfessionalId}
          setSelectedProfessionalId={setSelectedProfessionalId}
          services={services}
          slotsByProfessional={slotsByProfessional}
          setSlotsByProfessional={setSlotsByProfessional}
          loadDashboardData={loadData}
          handleDeleteSlot={handleDeleteSlot}
          handleMoveSlot={handleMoveSlot}
          colors={COLORS}
          loadingSlots={loadingSlots}
        />
      </div>
    </div>
  );
}
