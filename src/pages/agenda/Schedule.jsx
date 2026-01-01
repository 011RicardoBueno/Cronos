import React, { useState, useEffect, useCallback } from "react";
import { useSalon } from "../../context/SalonContext";
import { useProfessionalSlots } from "../../hooks/useProfessionalSlots";
import { deleteSlot, updateSlotTime } from "../../services/supabaseService";
import ProfessionalCalendar from "../../components/ProfessionalCalendar";
import CheckoutModal from "../../components/CheckoutModal"; // Importado o novo componente
import BackButton from "../../components/ui/BackButton";
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
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 my-6">
          <h2 className="text-2xl font-bold text-brand-text">Agenda: {salon?.name}</h2>
          <div className="flex items-center gap-3">
            <label className="font-medium text-brand-muted text-sm">Filtrar Profissional:</label>
            <select 
              value={selectedProfId} 
              onChange={(e) => setSelectedProfId(e.target.value)} 
              className="bg-brand-card border border-brand-muted/30 rounded-lg p-2 text-brand-text focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer"
            >
              <option value="all">Todos</option>
              {professionals?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {(selectedProfId === "all" ? professionals : professionals.filter(p => p.id === selectedProfId))?.map(pro => (
            <div key={pro.id} className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20 shadow-sm">
              <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-brand-primary rounded-full"></span>
                {pro.name}
              </h3>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-card w-full max-w-md rounded-3xl p-6 border border-brand-muted/20 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-brand-text">Detalhes do Atendimento</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-brand-muted hover:text-brand-text transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-brand-text">
                <User size={18} className="text-brand-muted"/> 
                <span className="text-brand-text"><strong className="text-brand-muted">Cliente:</strong> {selectedSlot?.client_name}</span>
              </div>
              <div className="flex items-center gap-3 text-brand-text">
                <Scissors size={18} className="text-brand-muted"/> 
                <span className="text-brand-text"><strong className="text-brand-muted">Serviço:</strong> {selectedSlot?.services?.name}</span>
              </div>
              <div className="flex items-center gap-3 text-brand-text">
                <Clock size={18} className="text-brand-muted"/> 
                <span className="text-brand-text"><strong className="text-brand-muted">Horário:</strong> {moment(selectedSlot?.start_time).format('HH:mm')}</span>
              </div>
              <div className="flex items-center gap-3 text-brand-text">
                <DollarSign size={18} className="text-brand-muted"/> 
                <span className="text-brand-text"><strong className="text-brand-muted">Valor:</strong> R$ {selectedSlot?.services?.price}</span>
              </div>
              
              {selectedSlot?.status === 'completed' && (
                <div className="mt-4 p-3 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border border-green-500/20">
                  <CheckCircle2 size={16} /> ATENDIMENTO FINALIZADO
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={handleDelete} 
                disabled={isProcessing || selectedSlot?.status === 'completed'} 
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all
                  ${selectedSlot?.status === 'completed' 
                    ? 'bg-brand-muted/10 text-brand-muted cursor-not-allowed' 
                    : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}
                `}
              >
                <Trash2 size={18}/> {selectedSlot?.status === 'completed' ? 'Bloqueado' : 'Cancelar'}
              </button>
              
              <button 
                onClick={startCheckoutFlow} 
                disabled={isProcessing || selectedSlot?.status === 'completed'} 
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all
                  ${selectedSlot?.status === 'completed' 
                    ? 'bg-brand-muted cursor-default opacity-70 text-white' 
                    : 'bg-brand-primary text-white hover:opacity-90'}
                `}
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