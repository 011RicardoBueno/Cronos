import React, { useState, useEffect, useCallback } from "react";
import { useSalon } from "../../context/SalonContext";
import { useProfessionalSlots } from "../../hooks/useProfessionalSlots";
import { deleteSlot, updateSlotTime } from "../../services/supabaseService";
import ProfessionalCalendar from "../../components/ProfessionalCalendar";
import CheckoutModal from "../../components/CheckoutModal"; // Importado o novo componente
import BackButton from "../../components/ui/BackButton";
import { COLORS } from "../../constants/dashboard";
import { CheckCircle2, Trash2, X, User, Clock, Scissors, DollarSign } from "lucide-react";
import moment from "moment";

export default function Agenda() {
  const { salon, professionals } = useSalon();
  const [selectedProfId, setSelectedProfId] = useState("all");
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  
  // Estados dos Modais
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { 
    slotsByProfessional, 
    loadingSlots: _loadingSlots, 
    loadProfessionalSlots, 
    updateSlotsAfterDelete, 
    updateSlotsAfterMove 
  } = useProfessionalSlots();

  // Função auxiliar para calcular limites do calendário baseados no horário do salão
  const getCalendarTime = (timeString, fallbackHour) => {
    try {
      const baseDate = moment(currentViewDate).startOf('day'); 
      if (!timeString || typeof timeString !== 'string') return baseDate.set({ hour: fallbackHour, minute: 0 }).toDate();
      const [hours, minutes] = timeString.split(':');
      return baseDate.clone().set({ hour: parseInt(hours), minute: parseInt(minutes), second: 0 }).toDate();
    } catch (err) {
      console.error(err);
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

  // Abre o modal de detalhes ao clicar no evento
  const handleSelectSlot = (slot) => {
    if (!slot || !slot.id) return;
    setSelectedSlot(slot);
    setIsDetailModalOpen(true);
  };

  // Inicia o fluxo de checkout
  const startCheckoutFlow = () => {
    setIsDetailModalOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleDelete = async () => {
    if(!selectedSlot?.id) return;

    if (selectedSlot.status === 'completed') {
      alert("Este agendamento já foi finalizado e faturado. Não é possível cancelá-lo.");
      return;
    }

    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;

    try {
      setIsProcessing(true);
      await deleteSlot(selectedSlot.id);
      updateSlotsAfterDelete(selectedSlot.professional_id, selectedSlot.id);
      setIsDetailModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao deletar");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMove = async (profId, slotId, newStart) => {
    try {
      await updateSlotTime(slotId, newStart);
      updateSlotsAfterMove(profId, slotId, newStart.toISOString());
    } catch (err) {
      console.error(err);
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
            <label style={{ fontWeight: '500' }}>Filtrar Profissional:</label>
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

      {/* MODAL DE DETALHES DO AGENDAMENTO */}
      {isDetailModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{margin:0}}>Detalhes do Atendimento</h3>
              <button onClick={() => setIsDetailModalOpen(false)} style={styles.closeBtn}><X size={20}/></button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.infoRow}><User size={18} color="#666"/> <strong>Cliente:</strong> {selectedSlot?.client_name}</div>
              <div style={styles.infoRow}><Scissors size={18} color="#666"/> <strong>Serviço:</strong> {selectedSlot?.services?.name}</div>
              <div style={styles.infoRow}><Clock size={18} color="#666"/> <strong>Horário:</strong> {moment(selectedSlot?.start_time).format('HH:mm')}</div>
              <div style={styles.infoRow}><DollarSign size={18} color="#666"/> <strong>Valor do Serviço:</strong> R$ {selectedSlot?.services?.price}</div>
              
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
                onClick={startCheckoutFlow} 
                disabled={isProcessing || selectedSlot?.status === 'completed'} 
                style={{
                  ...styles.actionBtn, 
                  backgroundColor: COLORS.sageGreen, 
                  color: 'white',
                  opacity: selectedSlot?.status === 'completed' ? 0.7 : 1,
                  cursor: selectedSlot?.status === 'completed' ? 'default' : 'pointer'
                }}
              >
                <CheckCircle2 size={18}/> {selectedSlot?.status === 'completed' ? 'Já Pago' : 'Finalizar / Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT (Produtos + Serviços + Comissões) */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        slot={selectedSlot}
        onComplete={loadData} // Recarrega os dados para pintar o slot de "concluído"
      />
    </div>
  );
}

const styles = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: "20px 0" },
  filterBox: { display: 'flex', alignItems: 'center', gap: '10px' },
  select: { padding: '8px', borderRadius: '8px', border: `1px solid ${COLORS.sageGreen}`, outline: 'none' },
  calendarCard: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px' },
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