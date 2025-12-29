import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Para o botão de retorno
import ProfessionalsSection from "../../components/ProfessionalsSection";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useProfessionalSlots } from "../../hooks/useProfessionalSlots";
import { useProfessionalFilter } from "../../hooks/useProfessionalFilter";
import { deleteSlot, updateSlotTime } from "../../services/supabaseService";
import { COLORS } from "../../constants/dashboard";

export default function Agenda({ session }) {
  const navigate = useNavigate();

  // 1. Gerenciar filtro de profissional
  const {
    selectedProfessionalId,
    setSelectedProfessionalId
  } = useProfessionalFilter("all");

  // 2. Carregar dados principais
  const { 
    salon, 
    services, 
    professionals, 
    loading, 
    error,
    loadData 
  } = useDashboardData(session, selectedProfessionalId);

  // 3. Gerenciar slots (agendamentos)
  const {
    slotsByProfessional,
    loadingSlots,
    loadProfessionalSlots,
    updateSlotsAfterDelete,
    updateSlotsAfterMove,
    setSlotsByProfessional
  } = useProfessionalSlots();

  // 4. Carregar slots quando os profissionais são carregados
  useEffect(() => {
    if (professionals && professionals.length > 0) {
      loadProfessionalSlots(professionals);
    }
  }, [professionals, loadProfessionalSlots]);

  // 5. Funções de manipulação (Resolvendo o ReferenceError)
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

  // Estados de carregamento e erro
  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Carregando agenda...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "red" }}>{error}</div>;
  if (!salon) return <div style={{ padding: 40, textAlign: "center" }}>Salão não encontrado.</div>;

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        
        {/* Botão de Retorno */}
        <button 
          onClick={() => navigate(-1)} 
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: COLORS.deepCharcoal,
            cursor: "pointer",
            marginBottom: "20px",
            fontSize: "16px",
            fontWeight: "500"
          }}
        >
          ← Voltar para o Painel
        </button>

        <h2 style={{ marginBottom: "20px", color: COLORS.deepCharcoal }}>
          Agenda: {salon.name}
        </h2>

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