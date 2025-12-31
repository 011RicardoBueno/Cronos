import React, { useState, useEffect, useCallback } from "react";
import { useSalon } from "../../context/SalonContext";
import { useProfessionalSlots } from "../../hooks/useProfessionalSlots"; // Importando o novo hook
import { deleteSlot, updateSlotTime } from "../../services/supabaseService"; // Importando do service
import ProfessionalCalendar from "../../components/ProfessionalCalendar";
import BackButton from "../../components/ui/BackButton";
import { COLORS } from "../../constants/dashboard";

export default function Agenda() {
  const { salon, professionals } = useSalon();
  const [selectedProfId, setSelectedProfId] = useState("all");
  
  // Usando o nosso hook refatorado
  const { 
    slotsByProfessional, 
    loadingSlots, 
    loadProfessionalSlots, 
    updateSlotsAfterDelete, 
    updateSlotsAfterMove 
  } = useProfessionalSlots();

  const loadData = useCallback(async () => {
    if (!professionals || professionals.length === 0) return;
    
    // Exemplo: buscando slots do mês atual para evitar sobrecarga
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    await loadProfessionalSlots(professionals, firstDay, lastDay);
  }, [professionals, loadProfessionalSlots]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayedProfessionals = selectedProfId === "all"
    ? professionals
    : professionals.filter(p => p.id === selectedProfId);

  const handleDelete = async (profId, slotId) => {
    if(!window.confirm("Excluir agendamento?")) return;
    try {
      await deleteSlot(slotId);
      updateSlotsAfterDelete(profId, slotId); // Atualiza UI instantaneamente
    } catch (err) {
      alert("Erro ao deletar slot");
    }
  };

  const handleMove = async (profId, slotId, newStart) => {
    try {
      await updateSlotTime(slotId, newStart);
      updateSlotsAfterMove(profId, slotId, newStart.toISOString()); // Atualiza UI instantaneamente
    } catch (err) {
      alert("Erro ao mover slot");
    }
  };

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <BackButton colors={COLORS} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: "20px 0" }}>
          <h2 style={{ color: COLORS.deepCharcoal, margin: 0 }}>
            Agenda: {salon?.name || "Carregando..."}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: '500' }}>Filtrar por:</label>
            <select 
              value={selectedProfId} 
              onChange={(e) => setSelectedProfId(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${COLORS.sageGreen}` }}
            >
              <option value="all">Todos os Profissionais</option>
              {professionals?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {displayedProfessionals?.map(pro => (
            <div key={pro.id} style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '16px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              opacity: loadingSlots[pro.id] ? 0.6 : 1 // Feedback visual de loading por profissional
            }}>
              <h3 style={{ marginBottom: '15px', color: COLORS.deepCharcoal }}>
                Agenda de {pro.name} {loadingSlots[pro.id] && "(Carregando...)"}
              </h3>
              
              <ProfessionalCalendar
                slots={slotsByProfessional[pro.id] || []}
                handleDeleteSlot={(slotId) => handleDelete(pro.id, slotId)}
                handleMoveSlot={({ slotId, newStart }) => handleMove(pro.id, slotId, newStart)}
                openingTime={salon?.opening_time}
                closingTime={salon?.closing_time}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}