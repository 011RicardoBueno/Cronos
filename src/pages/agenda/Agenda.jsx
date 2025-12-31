import React, { useState, useEffect, useCallback } from "react";
import { useSalon } from "../../context/SalonContext";
import { useProfessionalSlots } from "../../hooks/useProfessionalSlots";
import { deleteSlot, updateSlotTime } from "../../services/supabaseService";
import { supabase } from "../../lib/supabase";
import ProfessionalCalendar from "../../components/ProfessionalCalendar";
import BackButton from "../../components/ui/BackButton";
import { COLORS } from "../../constants/dashboard";
import { CheckCircle2, Trash2, X, User, Clock, Scissors, DollarSign } from "lucide-react";
import moment from "moment";

export default function Agenda() {
  const { salon, professionals } = useSalon();
  const [selectedProfId, setSelectedProfId] = useState("all");
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  
  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { 
    slotsByProfessional, 
    loadingSlots, 
    loadProfessionalSlots, 
    updateSlotsAfterDelete, 
    updateSlotsAfterMove 
  } = useProfessionalSlots();

  const getCalendarTime = (timeString, fallbackHour) => {
    try {
      const baseDate = moment(currentViewDate).startOf('day'); 
      if (!timeString || typeof timeString !== 'string') return baseDate.set({ hour: fallbackHour, minute: 0 }).toDate();
      const [hours, minutes] = timeString.split(':');
      return baseDate.clone().set({ hour: parseInt(hours), minute: parseInt(minutes), second: 0 }).toDate();
    } catch (err) {
      return moment(currentViewDate).startOf('day').set({ hour: fallbackHour }).toDate();
    }
  };

  const loadData = useCallback(async () => {
    if (!professionals || professionals.length === 0) return;
    const firstDay = moment(currentViewDate).startOf('month').toISOString();
    const lastDay = moment(currentViewDate).endOf('month').toISOString();
    await loadProfessionalSlots(professionals, firstDay, lastDay);
  }, [professionals, loadProfessionalSlots, currentViewDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Função disparada ao clicar no evento do calendário
  const handleSelectSlot = (slot) => {
    if (!slot || !slot.id) return;
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if(!selectedSlot?.id) return;

    // Trava: Não permite deletar se já estiver concluído
    if (selectedSlot.status === 'completed') {
      alert("Este agendamento já foi finalizado e faturado. Não é possível cancelá-lo.");
      return;
    }

    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;

    try {
      setIsProcessing(true);
      await deleteSlot(selectedSlot.id);
      updateSlotsAfterDelete(selectedSlot.professional_id, selectedSlot.id);
      setIsModalOpen(false);
    } catch (err) {
      alert("Erro ao deletar");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if(!selectedSlot?.id) return;
    try {
      setIsProcessing(true);
      
      // 1. Atualiza agendamento para 'completed'
      const { error: slotError } = await supabase
        .from('slots')
        .update({ status: 'completed' })
        .eq('id', selectedSlot.id);

      if (slotError) throw slotError;

      // 2. Registra na tabela de finanças
      const valorTotal = selectedSlot.services?.price || 0;
      const { error: finError } = await supabase
        .from('finance_transactions')
        .insert([{
          salon_id: salon.id,
          type: 'income',
          category: 'servico',
          amount: valorTotal,
          description: `Serviço: ${selectedSlot.services?.name} - Cliente: ${selectedSlot.client_name}`,
          professional_id: selectedSlot.professional_id,
          professional_commission: valorTotal * 0.5 // 50% de comissão fixa
        }]);

      if (finError) throw finError;

      alert("Atendimento finalizado com sucesso!");
      setIsModalOpen(false);
      loadData(); // Recarrega para atualizar status visual (cor) na agenda
    } catch (err) {
      alert("Erro no checkout: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMove = async (profId, slotId, newStart) => {
    try {
      await updateSlotTime(slotId, newStart);
      updateSlotsAfterMove(profId, slotId, newStart.toISOString());
    } catch (err) {
      alert("Erro ao mover");
    }
  };

  const minTime = getCalendarTime(salon?.opening_time, 8);
  const maxTime = getCalendarTime(salon?.closing_time, 20);

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <BackButton colors={COLORS} />
        
        <div style={styles.headerRow}>
          <h2 style={{ color: COLORS.deepCharcoal, margin: 0 }}>Agenda: {salon?.name}</h2>
          <div style={styles.filterBox}>
            <label style={{ fontWeight: '500' }}>Filtrar:</label>
            <select value={selectedProfId} onChange={(e) => setSelectedProfId(e.target.value)} style={styles.select}>
              <option value="all">Todos</option>
              {professionals?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {(selectedProfId === "all" ? professionals : professionals.filter(p => p.id === selectedProfId))?.map(pro => (
            <div key={pro.id} style={styles.calendarCard}>
              <h3 style={{ marginBottom: '15px', color: COLORS.deepCharcoal }}>{pro.name}</h3>
              <ProfessionalCalendar
                slots={slotsByProfessional[pro.id] || []}
                handleDeleteSlot={handleSelectSlot}
                handleMoveSlot={({ slotId, newStart }) => handleMove(pro.id, slotId, newStart)}
                min={minTime}
                max={maxTime}
                onRangeChange={(newDate) => setCurrentViewDate(newDate)}
              />
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{margin:0}}>Detalhes do Atendimento</h3>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}><X size={20}/></button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.infoRow}><User size={18} color="#666"/> <strong>Cliente:</strong> {selectedSlot?.client_name}</div>
              <div style={styles.infoRow}><Scissors size={18} color="#666"/> <strong>Serviço:</strong> {selectedSlot?.services?.name}</div>
              <div style={styles.infoRow}><Clock size={18} color="#666"/> <strong>Horário:</strong> {moment(selectedSlot?.start_time).format('HH:mm')}</div>
              <div style={styles.infoRow}><DollarSign size={18} color="#666"/> <strong>Valor:</strong> R$ {selectedSlot?.services?.price}</div>
              
              {selectedSlot?.status === 'completed' && (
                <div style={styles.statusBadge}>
                  <CheckCircle2 size={16} /> ATENDIMENTO FINALIZADO
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button 
                onClick={handleDelete} 
                disabled={isProcessing || selectedSlot?.status === 'completed'} 
                style={{
                  ...styles.actionBtn, 
                  backgroundColor: '#FFF5F5', 
                  color: '#E53E3E',
                  opacity: selectedSlot?.status === 'completed' ? 0.5 : 1,
                  cursor: selectedSlot?.status === 'completed' ? 'not-allowed' : 'pointer'
                }}
              >
                <Trash2 size={18}/> {selectedSlot?.status === 'completed' ? 'Bloqueado' : 'Cancelar'}
              </button>
              
              <button 
                onClick={handleCheckout} 
                disabled={isProcessing || selectedSlot?.status === 'completed'} 
                style={{
                  ...styles.actionBtn, 
                  backgroundColor: COLORS.sageGreen, 
                  color: 'white',
                  opacity: selectedSlot?.status === 'completed' ? 0.7 : 1,
                  cursor: selectedSlot?.status === 'completed' ? 'default' : 'pointer'
                }}
              >
                <CheckCircle2 size={18}/> {selectedSlot?.status === 'completed' ? 'Já Pago' : 'Finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: "20px 0" },
  filterBox: { display: 'flex', alignItems: 'center', gap: '10px' },
  select: { padding: '8px', borderRadius: '8px', border: `1px solid ${COLORS.sageGreen}`, outline: 'none' },
  calendarCard: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  modalOverlay: { position: 'fixed', top:0, left:0, right:0, bottom:0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalContent: { backgroundColor: 'white', padding: '24px', borderRadius: '20px', width: '90%', maxWidth: '380px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#999' },
  modalBody: { display: 'grid', gap: '15px', marginBottom: '25px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#333' },
  statusBadge: { backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' },
  modalFooter: { display: 'flex', gap: '10px' },
  actionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }
};