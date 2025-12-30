import React, { useEffect } from "react";
import { useSalon } from "../../context/SalonContext"; // Importação do Contexto
import { useProfessionalSlots } from "../../hooks/useProfessionalSlots";
import { useProfessionalFilter } from "../../hooks/useProfessionalFilter";
import { deleteSlot, updateSlotTime } from "../../services/supabaseService";
import BackButton from "../../components/ui/BackButton";
import { COLORS } from "../../constants/dashboard";
import ProfessionalsSection from "../../components/ProfessionalsSection";

export default function Agenda() {
  // 1. Pegamos os dados globais do SalonContext (Isso evita o re-loading infinito)
  const { 
    salon, 
    services, 
    professionals, 
    loading: loadingContext, 
    error: errorContext,
    refreshData 
  } = useSalon();

  // 2. Gerenciar filtro de profissional
  const {
    selectedProfessionalId,
    setSelectedProfessionalId
  } = useProfessionalFilter("all");

  // 3. Gerenciar slots (agendamentos) - Lógica específica da página de agenda
  const {
    slotsByProfessional,
    loadingSlots,
    loadProfessionalSlots,
    updateSlotsAfterDelete,
    updateSlotsAfterMove,
    setSlotsByProfessional
  } = useProfessionalSlots();

  // 4. Carregar slots assim que os profissionais estiverem disponíveis no contexto
  useEffect(() => {
    if (professionals && professionals.length > 0) {
      loadProfessionalSlots(professionals);
    }
  }, [professionals, loadProfessionalSlots]);

  // 5. Funções de manipulação
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

  // 6. Verificação de estados de carregamento
  // Se o contexto ainda estiver buscando dados do salão
  if (loadingContext) {
    return <div style={{ padding: 40, textAlign: "center", color: COLORS.deepCharcoal }}>Carregando dados da agenda...</div>;
  }

  if (errorContext) {
    return <div style={{ padding: 40, textAlign: "center", color: "red" }}>Erro: {errorContext}</div>;
  }

  if (!salon) {
    return <div style={{ padding: 40, textAlign: "center" }}>Salão não encontrado ou sessão expirada.</div>;
  }

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        
        {/* Botão de Retorno Centralizado */}
        <BackButton colors={COLORS} />

        <h2 style={{ marginBottom: "20px", color: COLORS.deepCharcoal }}>
          Agenda: {salon.name}
        </h2>

        {/* Componente que renderiza o calendário e os profissionais */}
        <ProfessionalsSection
          professionals={professionals}
          selectedProfessionalId={selectedProfessionalId}
          setSelectedProfessionalId={setSelectedProfessionalId}
          services={services}
          slotsByProfessional={slotsByProfessional}
          setSlotsByProfessional={setSlotsByProfessional}
          loadDashboardData={refreshData} // Agora usamos o refresh do contexto
          handleDeleteSlot={handleDeleteSlot}
          handleMoveSlot={handleMoveSlot}
          colors={COLORS}
          loadingSlots={loadingSlots}
        />
      </div>
    </div>
  );
}