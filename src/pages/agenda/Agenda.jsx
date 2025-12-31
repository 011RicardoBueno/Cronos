import React, { useState, useEffect, useCallback } from "react";
import { useSalon } from "../../context/SalonContext";
import { useProfessionalSlots } from "../../hooks/useProfessionalSlots";
import { deleteSlot, updateSlotTime } from "../../services/supabaseService";
import ProfessionalCalendar from "../../components/ProfessionalCalendar";
import BackButton from "../../components/ui/BackButton";
import { COLORS } from "../../constants/dashboard";
import moment from "moment";

export default function Agenda() {
  const { salon, professionals } = useSalon();
  const [selectedProfId, setSelectedProfId] = useState("all");
  
  // Estado para controlar qual data o usuário está visualizando no calendário
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  
  const { 
    slotsByProfessional, 
    loadingSlots, 
    loadProfessionalSlots, 
    updateSlotsAfterDelete, 
    updateSlotsAfterMove 
  } = useProfessionalSlots();

  /**
   * Converte a string "HH:mm" em objeto Date.
   */
  const getCalendarTime = (timeString, fallbackHour) => {
    try {
      const baseDate = moment(currentViewDate).startOf('day'); 
      
      if (!timeString || typeof timeString !== 'string') {
        return baseDate.set({ hour: fallbackHour, minute: 0 }).toDate();
      }

      const [hours, minutes] = timeString.split(':');
      return baseDate.clone().set({ 
        hour: parseInt(hours), 
        minute: parseInt(minutes), 
        second: 0,
        millisecond: 0 
      }).toDate();
    } catch (err) {
      console.error("Erro ao processar horário:", err);
      return moment(currentViewDate).startOf('day').set({ hour: fallbackHour }).toDate();
    }
  };

  // Função para carregar dados baseada na data que o usuário está vendo
  const loadData = useCallback(async () => {
    if (!professionals || professionals.length === 0) return;
    
    // Busca o mês inteiro da data que está sendo visualizada para garantir que a paginação tenha dados
    const firstDay = moment(currentViewDate).startOf('month').toISOString();
    const lastDay = moment(currentViewDate).endOf('month').toISOString();

    console.log(`Buscando slots de ${firstDay} até ${lastDay}`);
    await loadProfessionalSlots(professionals, firstDay, lastDay);
  }, [professionals, loadProfessionalSlots, currentViewDate]);

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
      updateSlotsAfterDelete(profId, slotId);
    } catch (err) {
      alert("Erro ao deletar slot");
    }
  };

  const handleMove = async (profId, slotId, newStart) => {
    try {
      await updateSlotTime(slotId, newStart);
      updateSlotsAfterMove(profId, slotId, newStart.toISOString());
    } catch (err) {
      alert("Erro ao mover slot");
    }
  };

  const rawMin = getCalendarTime(salon?.opening_time, 8);
  const rawMax = getCalendarTime(salon?.closing_time, 20);
  const isInvalidRange = moment(rawMax).isSameOrBefore(moment(rawMin));

  const minTime = rawMin;
  const maxTime = isInvalidRange 
    ? moment(rawMin).add(12, 'hours').toDate() 
    : rawMax;

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
              style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${COLORS.sageGreen}`, outline: 'none' }}
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
            <div 
              key={`${pro.id}-${salon?.opening_time}-${salon?.closing_time}-${currentViewDate.getMonth()}`} 
              style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '16px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                opacity: loadingSlots[pro.id] ? 0.6 : 1 
              }}
            >
              <h3 style={{ marginBottom: '15px', color: COLORS.deepCharcoal }}>
                Agenda de {pro.name} {loadingSlots[pro.id] && "(Carregando...)"}
              </h3>
              
              <ProfessionalCalendar
                slots={slotsByProfessional[pro.id] || []}
                handleDeleteSlot={(slotId) => handleDelete(pro.id, slotId)}
                handleMoveSlot={({ slotId, newStart }) => handleMove(pro.id, slotId, newStart)}
                min={minTime}
                max={maxTime}
                // Função para atualizar a data quando o usuário navega no calendário
                onRangeChange={(newDate) => setCurrentViewDate(newDate)}
              />
              
              {isInvalidRange && (
                <p style={{ color: '#d9534f', fontSize: '0.8rem', marginTop: '10px' }}>
                  * Nota: O horário de fechamento configurado é inválido. Exibindo intervalo padrão.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}