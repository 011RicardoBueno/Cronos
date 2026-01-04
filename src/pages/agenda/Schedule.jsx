import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSalon } from "../../context/SalonContext";
import { supabase } from "../../lib/supabase";
import ProfessionalAgendaCard from "../../components/ProfessionalAgendaCard";
import CheckoutModal from "../../components/CheckoutModal";
import Button from "../../components/ui/Button";
import { Calendar, ChevronLeft, ChevronRight, Loader2, CheckCircle2, DollarSign, X, User, Scissors, Info, Lock, Trash2, ClipboardList, View } from "lucide-react";
import moment from "moment";
import { toast } from "react-hot-toast";
import DailySummary from "../../components/DailySummary";
import WaitingListModal from "../../components/WaitingListModal";
import AgendaSkeleton from "../../components/AgendaSkeleton";

export default function Agenda() {
  const { salon, professionals } = useSalon();
  const [currentDate, setCurrentDate] = useState(moment());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('all');
  const [now, setNow] = useState(moment());
  const [viewMode, setViewMode] = useState('day'); // 'day' or 'week'
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [draggedSlot, setDraggedSlot] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockData, setBlockData] = useState({
    professionalId: '',
    startTime: '12:00',
    duration: 60,
    title: 'Almoço'
  });

  const [isWaitingListOpen, setIsWaitingListOpen] = useState(false);
  const [waitingListCount, setWaitingListCount] = useState(0);

  const timeInterval = 30; // minutes

  useEffect(() => {
    if (salon?.id) {
      fetchSlotsForDate();
    }
  }, [salon?.id, currentDate, viewMode]); // Re-fetch when viewMode changes

  useEffect(() => {
    if (salon?.id) {
      fetchWaitingListCount();
    }
  }, [salon?.id]);

  const fetchWaitingListCount = async () => {
    const { count } = await supabase
      .from('waiting_list')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon.id);
    setWaitingListCount(count || 0);
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(moment()), 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // In week view, we need a single professional selected.
    if (viewMode === 'week' && selectedProfessionalId === 'all' && professionals.length > 0) {
      setSelectedProfessionalId(professionals[0].id);
    }
  }, [viewMode, selectedProfessionalId, professionals]);

  const filteredProfessionals = useMemo(() => {
    if (selectedProfessionalId === 'all') return professionals;
    return professionals.filter(p => p.id === selectedProfessionalId);
  }, [professionals, selectedProfessionalId]);

  const filteredSlots = useMemo(() => {
    let result = slots;
    if (selectedProfessionalId !== 'all') {
      result = result.filter(s => s.professional_id === selectedProfessionalId);
    }
    if (filterStatus !== 'all') {
      result = result.filter(s => s.status === filterStatus);
    }
    return result;
  }, [slots, selectedProfessionalId, filterStatus]);

  const fetchSlotsForDate = useCallback(async () => {
    setLoading(true);
    const startDate = (viewMode === 'week' ? currentDate.clone().startOf('week') : currentDate.clone().startOf('day')).toISOString();
    const endDate = (viewMode === 'week' ? currentDate.clone().endOf('week') : currentDate.clone().endOf('day')).toISOString();

    const { data, error } = await supabase
      .from('slots')
      .select('*, services(*), professionals(name)')
      .eq('salon_id', salon.id)
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    if (error) {
      console.error("Erro ao buscar agendamentos:", error);
      setSlots([]);
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  }, [salon?.id, currentDate, viewMode]);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setIsDetailsOpen(true);
  };

  const handleProceedToCheckout = () => {
    setIsDetailsOpen(false);
    // O selectedSlot já está no estado, então o CheckoutModal o receberá
    setIsCheckoutOpen(true);
  };

  const timeSlots = useMemo(() => {
    if (!salon) return [];
    const slots = [];
    const start = moment().startOf('day').set({ 
      hour: parseInt((salon.opening_time || '08:00').split(':')[0]), 
      minute: 0 
    });
    const end = moment().startOf('day').set({ 
      hour: parseInt((salon.closing_time || '20:00').split(':')[0]), 
      minute: 0 
    });

    let current = start.clone();
    while (current.isBefore(end)) {
      slots.push(current.format('HH:mm'));
      current.add(timeInterval, 'minutes');
    }
    return slots;
  }, [salon]);

  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const startOfWeek = currentDate.clone().startOf('week');
    return Array.from({ length: 7 }).map((_, i) => startOfWeek.clone().add(i, 'days'));
  }, [currentDate, viewMode]);

  const getSlotPosition = (slot) => {
    const startTime = moment(slot.start_time);
    const openingTime = moment(startTime).startOf('day').set({
      hour: parseInt((salon.opening_time || '08:00').split(':')[0]),
      minute: 0
    });
    const minutesFromOpening = startTime.diff(openingTime, 'minutes');
    
    let duration = slot.services?.duration_minutes;
    if (!duration && slot.end_time) {
      duration = moment(slot.end_time).diff(startTime, 'minutes');
    }
    duration = duration || 30;
    
    const top = (minutesFromOpening / timeInterval) * 4; // 4rem per slot
    const height = (duration / timeInterval) * 4 - 0.5; // 4rem per slot, -0.5 for gap
    
    if (viewMode === 'day') {
      return { top: `${top}rem`, height: `${height}rem` };
    }

    // Week view positioning
    const dayIndex = startTime.day(); // Sunday = 0, Monday = 1...
    const left = `calc(${dayIndex} * (100% / 7))`;
    const width = `calc((100% / 7) - 4px)`; // Subtract gap

    return { top: `${top}rem`, height: `${height}rem`, left, width };
  };

  const getCurrentTimePosition = () => {
    if (!salon || !currentDate.isSame(moment(), 'day')) return null;

    const openingTime = moment(currentDate).startOf('day').set({
      hour: parseInt((salon.opening_time || '08:00').split(':')[0]),
      minute: 0
    });

    const minutesFromOpening = now.diff(openingTime, 'minutes');
    // 4rem (h-16) é a altura de um slot de 30 min
    const top = (minutesFromOpening / timeInterval) * 4;
    
    return `${top}rem`;
  };

  const changeDate = (amount) => {
    const unit = viewMode === 'week' ? 'weeks' : 'days';
    setCurrentDate(currentDate.clone().add(amount, unit));
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, slot) => {
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = 'move';
    // Hides the default browser ghost image, as we are using a custom indicator
    e.dataTransfer.setDragImage(new Image(), 0, 0);
  };

  const handleDragOver = (e, professionalIdForDayView) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedSlot) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    const pixelsPerRem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const headerHeight = 4 * pixelsPerRem; // h-16 = 4rem
    const slotHeight = 4 * pixelsPerRem;   // h-16 = 4rem

    const relativeY = y - headerHeight;
    if (relativeY < 0) {
      setDropIndicator(null);
      return;
    }

    const slotsCount = Math.round(relativeY / slotHeight);
    const openingHour = parseInt((salon.opening_time || '08:00').split(':')[0]);

    if (viewMode === 'week') {
        const x = e.clientX - rect.left;
        const dayIndex = Math.floor(x / (rect.width / 7));
        const dropDay = weekDays[dayIndex];
        const dropTime = dropDay.clone().startOf('day').set({ hour: openingHour, minute: 0 }).add(slotsCount * timeInterval, 'minutes');
        
        setDropIndicator({
            professionalId: selectedProfessionalId,
            time: dropTime,
            dayIndex: dayIndex
        });
    } else { // Day view
        const startOfDay = moment(currentDate).startOf('day').set({ hour: openingHour, minute: 0 });
        const dropTime = startOfDay.add(slotsCount * timeInterval, 'minutes');
        
        setDropIndicator({
            professionalId: professionalIdForDayView,
            time: dropTime,
        });
    }
  };

  const handleDragEnd = () => {
    setDraggedSlot(null);
    setDropIndicator(null);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (!draggedSlot || !dropIndicator) {
      handleDragEnd();
      return;
    }

    const { professionalId, time: newStartTime } = dropIndicator;
    const duration = draggedSlot.services?.duration_minutes || moment(draggedSlot.end_time).diff(moment(draggedSlot.start_time), 'minutes') || 30;
    const newEndTime = newStartTime.clone().add(duration, 'minutes');

    // Conflict check: A overlaps B if (A.start < B.end) and (A.end > B.start)
    const { data: conflicts, error: conflictError } = await supabase.from('slots')
      .select('id')
      .eq('professional_id', professionalId)
      .neq('id', draggedSlot.id) // Exclude the item being dragged
      .lt('start_time', newEndTime.toISOString())
      .gt('end_time', newStartTime.toISOString());

    if (conflictError || (conflicts && conflicts.length > 0)) {
      toast.error("Conflito de horário! Já existe um agendamento neste local.");
    } else {
      const { error } = await supabase.from('slots').update({ 
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        professional_id: professionalId
      }).eq('id', draggedSlot.id);

      if (error) {
        toast.error("Erro ao mover agendamento.");
      } else {
        toast.success("Agendamento atualizado!");
        fetchSlotsForDate(currentDate); // Refresh data
      }
    }
    handleDragEnd();
  };

  const handleSaveBlock = async (e) => {
    e.preventDefault();
    if (!blockData.professionalId) {
      toast.error("Selecione um profissional.");
      return;
    }

    const startDateTime = moment(currentDate).set({
      hour: parseInt(blockData.startTime.split(':')[0]),
      minute: parseInt(blockData.startTime.split(':')[1])
    });
    const endDateTime = startDateTime.clone().add(blockData.duration, 'minutes');

    const { error } = await supabase.from('slots').insert({
      salon_id: salon.id,
      professional_id: blockData.professionalId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      client_name: blockData.title || 'Bloqueio',
      status: 'blocked'
    });

    if (error) {
      toast.error("Erro ao criar bloqueio.");
    } else {
      toast.success("Horário bloqueado com sucesso!");
      setIsBlockModalOpen(false);
      fetchSlotsForDate(currentDate);
    }
  };

  const handleDeleteBlock = async (id) => {
    if (!window.confirm("Remover este bloqueio?")) return;
    try {
      const { error } = await supabase.from('slots').delete().eq('id', id);
      if (error) throw error;
      fetchSlotsForDate(currentDate);
    } catch (err) {
      toast.error("Erro ao remover bloqueio.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 my-8">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-bold text-brand-text">Agenda Diária</h2>
            <select 
              value={selectedProfessionalId}
              onChange={(e) => setSelectedProfessionalId(e.target.value)}
              className="bg-brand-card border border-brand-muted/20 rounded-xl px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary shadow-sm"
            >
              <option value="all">Todos os Profissionais</option>
              {professionals.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              {viewMode === 'week' && <option value="all" disabled>Selecione um profissional</option>}
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-brand-card border border-brand-muted/20 rounded-xl px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary shadow-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendentes</option>
              <option value="confirmed">Confirmados</option>
              <option value="completed">Concluídos</option>
            </select>
          </div>
          <button onClick={() => setIsBlockModalOpen(true)} className="flex items-center gap-2 bg-brand-card border border-brand-muted/20 px-4 py-2 rounded-xl font-bold text-brand-text hover:bg-brand-surface transition-colors">
            <Lock size={18} /> Bloquear Horário
          </button>
          <button onClick={() => setIsWaitingListOpen(true)} className="relative flex items-center gap-2 bg-brand-card border border-brand-muted/20 px-4 py-2 rounded-xl font-bold text-brand-text hover:bg-brand-surface transition-colors">
            <ClipboardList size={18} /> Lista de Espera
            {waitingListCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-in zoom-in">
                {waitingListCount}
              </span>
            )}
          </button>
          <div className="flex bg-brand-card rounded-lg p-1 border border-brand-muted/20">
              <button onClick={() => setViewMode('day')} className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${viewMode === 'day' ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-brand-text'}`}>
                Dia
              </button>
              <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${viewMode === 'week' ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-brand-text'}`}>
                Semana
              </button>
          </div>
          <div className="flex items-center gap-2 bg-brand-card p-2 rounded-2xl border border-brand-muted/20">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-brand-surface rounded-lg text-brand-muted"><ChevronLeft /></button>
            <input 
              type="date" 
              value={currentDate.format('YYYY-MM-DD')}
              onChange={(e) => setCurrentDate(moment(e.target.value))}
              className="bg-transparent font-semibold text-brand-text text-center outline-none"
            />
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-brand-surface rounded-lg text-brand-muted"><ChevronRight /></button>
            <button onClick={() => setCurrentDate(moment())} className="px-3 py-2 bg-brand-primary/10 text-brand-primary text-sm font-bold rounded-lg hover:bg-brand-primary/20">Hoje</button>
          </div>
        </header>

        <DailySummary slots={filteredSlots} viewMode={viewMode} />

        <div className="overflow-x-auto bg-brand-card border border-brand-muted/10 rounded-3xl p-4">
          <div className="flex" style={{ minWidth: viewMode === 'day' ? `${(filteredProfessionals.length || 1) * 250}px` : '100%' }}>
            {/* Time Column */}
            <div className="w-20 flex-shrink-0">
              <div className="h-16"></div> {/* Spacer for header */}
              {timeSlots.map(time => (
                <div key={time} className="h-16 text-right pr-4 text-xs font-mono text-brand-muted border-t border-brand-muted/10 flex items-center justify-end">
                  {time}
                </div>
              ))}
            </div>

            {/* Professional Columns */}
            {loading 
              ? <AgendaSkeleton professionalCount={viewMode === 'day' ? (filteredProfessionals.length || 1) : 7} timeSlotsCount={timeSlots.length} />
              : viewMode === 'day' 
              ? (
                filteredProfessionals.map(pro => (
                <div 
                  key={pro.id} 
                  className="flex-1 min-w-[250px] border-l border-brand-muted/10 relative"
                  onDragOver={(e) => handleDragOver(e, pro.id)}
                  onDrop={handleDrop}
                >
                  <div className="h-16 flex items-center justify-center text-center font-bold text-brand-text sticky top-0 bg-brand-card z-10">
                    {pro.name}
                  </div>
                  {/* Grid lines */}
                  {timeSlots.map(time => <div key={time} className="h-16 border-t border-brand-muted/10"></div>)}
                  
                  {/* Current Time Indicator */}
                  {getCurrentTimePosition() && (
                    <div 
                      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                      style={{ top: getCurrentTimePosition() }}
                    >
                      <div className="w-full border-t-2 border-red-500 shadow-sm"></div>
                      <div className="absolute -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                  )}

                  {/* Appointments */}
                  {filteredSlots.filter(s => s.professional_id === pro.id).map(slot => (

                      <div 
                        key={slot.id} 
                        className={`absolute left-2 right-2 z-20 cursor-grab transition-opacity ${draggedSlot?.id === slot.id ? 'opacity-30' : 'opacity-100'}`}
                        style={getSlotPosition(slot)}
                        onClick={() => handleSlotClick(slot)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, slot)}
                        onDragEnd={handleDragEnd}
                      >
                        {slot.status === 'blocked' ? (
                          <div className="w-full h-full bg-gray-100 border-l-4 border-gray-400 rounded-lg p-2 flex flex-col justify-center relative group overflow-hidden">
                            <div className="flex items-center gap-1 text-gray-600 font-bold text-xs">
                              <Lock size={12} />
                              <span className="truncate">{slot.client_name}</span>
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {moment(slot.start_time).format('HH:mm')} - {moment(slot.end_time).format('HH:mm')}
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteBlock(slot.id); }}
                              className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <ProfessionalAgendaCard slot={slot} />
                        )}
                      </div>
                    ))
                  }

                  {/* Drop Indicator (Ghost Card) */}
                  {dropIndicator && dropIndicator.professionalId === pro.id && draggedSlot && (
                    <div 
                      className="absolute left-2 right-2 z-10 bg-brand-primary/10 border-2 border-dashed border-brand-primary rounded-lg pointer-events-none"
                      style={{
                        top: getSlotPosition({ start_time: dropIndicator.time.toISOString(), services: { duration_minutes: draggedSlot?.services?.duration_minutes }, end_time: dropIndicator.time.clone().add(draggedSlot?.services?.duration_minutes || moment(draggedSlot?.end_time).diff(moment(draggedSlot?.start_time), 'minutes') || 30, 'minutes').toISOString() }).top,
                        height: getSlotPosition({ start_time: dropIndicator.time.toISOString(), services: { duration_minutes: draggedSlot?.services?.duration_minutes }, end_time: dropIndicator.time.clone().add(draggedSlot?.services?.duration_minutes || moment(draggedSlot?.end_time).diff(moment(draggedSlot?.start_time), 'minutes') || 30, 'minutes').toISOString() }).height
                      }}
                    />
                  )}
                </div>
                ))
              ) : ( // Week View
                <div className="flex-1 relative">
                  <div 
                    className="absolute inset-0"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                  </div>
                  <div className="flex sticky top-0 bg-brand-card z-10">
                    {weekDays.map(day => (
                      <div key={day.format('DD')} className="flex-1 min-w-[150px] h-16 flex flex-col items-center justify-center text-center font-bold text-brand-text border-l border-brand-muted/10">
                        <span>{day.format('ddd')}</span>
                        <span className={`text-xl ${day.isSame(moment(), 'day') ? 'text-brand-primary' : ''}`}>{day.format('DD')}</span>
                      </div>
                    ))}
                  </div>
                  {/* Grid lines & Appointments container */}
                  <div className="absolute top-16 left-0 right-0 bottom-0 flex">
                    {weekDays.map(day => (
                      <div key={day.format('DD')} className="flex-1 border-l border-brand-muted/10 relative">
                        {timeSlots.map(time => <div key={time} className="h-16 border-t border-brand-muted/10"></div>)}
                      </div>
                    ))}
                  </div>
                  {/* Appointments */}
                  {filteredSlots.map(slot => (
                    <div
                      key={slot.id}
                      className="absolute z-20 cursor-grab p-1"
                      style={getSlotPosition(slot)}
                      onClick={() => handleSlotClick(slot)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, slot)}
                      onDragEnd={handleDragEnd}
                    >
                      <ProfessionalAgendaCard slot={slot} isCompact={true} />
                    </div>
                  ))}
                  {/* Drop Indicator for Week View */}
                  {viewMode === 'week' && dropIndicator && draggedSlot && (
                    <div 
                      className="absolute z-10 bg-brand-primary/10 border-2 border-dashed border-brand-primary rounded-lg pointer-events-none"
                      style={{
                        top: getSlotPosition({ start_time: dropIndicator.time.toISOString(), services: draggedSlot.services, end_time: draggedSlot.end_time }).top,
                        height: getSlotPosition({ start_time: dropIndicator.time.toISOString(), services: draggedSlot.services, end_time: draggedSlot.end_time }).height,
                        left: `calc(${dropIndicator.dayIndex} * (100% / 7))`,
                        width: `calc((100% / 7) - 4px)`
                      }}
                    />
                  )}
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DO AGENDAMENTO */}
      {isDetailsOpen && selectedSlot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-brand-card p-8 rounded-3xl w-full max-w-md m-4 relative shadow-2xl border border-brand-muted/10 animate-in zoom-in-95">
            <button onClick={() => setIsDetailsOpen(false)} className="absolute top-4 right-4 p-2 text-brand-muted hover:bg-brand-surface rounded-full transition-colors">
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-brand-text mb-2">Detalhes do Agendamento</h3>
            <p className="text-sm text-brand-muted mb-6">
              {moment(selectedSlot.start_time).format('dddd, DD [de] MMMM [de] YYYY')}
            </p>

            <div className="space-y-3 mb-8 bg-brand-surface p-4 rounded-2xl border border-brand-muted/10">
              <div className="flex items-center gap-3">
                <User size={16} className="text-brand-primary" />
                <span className="font-semibold text-brand-text">{selectedSlot.client_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Scissors size={16} className="text-brand-primary" />
                <span className="font-semibold text-brand-text">{selectedSlot.services?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Info size={16} className="text-brand-primary" />
                <span className="font-semibold text-brand-text capitalize">{selectedSlot.status}</span>
              </div>
            </div>

            {selectedSlot.status === 'completed' ? (
              <div className="p-4 rounded-xl bg-green-500/10 text-green-600 text-center font-bold flex items-center justify-center gap-3">
                <CheckCircle2 size={20} />
                <span>Agendamento Finalizado</span>
              </div>
            ) : (
              <Button 
                onClick={handleProceedToCheckout}
                className="w-full"
              >
                <DollarSign size={20} />
                Finalizar e Cobrar (Checkout)
              </Button>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT (Produtos + Serviços + Comissões) */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        slot={selectedSlot}
        onComplete={() => fetchSlotsForDate(currentDate)}
      />

      {/* MODAL DE BLOQUEIO */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-brand-card p-6 rounded-3xl w-full max-w-sm m-4 relative shadow-2xl border border-brand-muted/10 animate-in zoom-in-95">
            <button onClick={() => setIsBlockModalOpen(false)} className="absolute top-4 right-4 p-2 text-brand-muted hover:bg-brand-surface rounded-full transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
              <Lock size={20} className="text-brand-primary" /> Bloquear Horário
            </h3>
            <form onSubmit={handleSaveBlock} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Profissional</label>
                <select 
                  value={blockData.professionalId}
                  onChange={(e) => setBlockData({...blockData, professionalId: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
                  required
                >
                  <option value="">Selecione...</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Início</label>
                  <input 
                    type="time" 
                    value={blockData.startTime}
                    onChange={(e) => setBlockData({...blockData, startTime: e.target.value})}
                    className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Duração (min)</label>
                  <input 
                    type="number" 
                    step="15"
                    value={blockData.duration}
                    onChange={(e) => setBlockData({...blockData, duration: Number(e.target.value)})}
                    className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Motivo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Almoço, Folga, Pessoal"
                  value={blockData.title}
                  onChange={(e) => setBlockData({...blockData, title: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
              <Button type="submit" className="w-full mt-2">Confirmar Bloqueio</Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE LISTA DE ESPERA */}
      {isWaitingListOpen && (
        <WaitingListModal 
          isOpen={isWaitingListOpen}
          onClose={() => setIsWaitingListOpen(false)}
          salonId={salon?.id}
          professionals={professionals}
          onUpdate={fetchWaitingListCount}
        />
      )}
    </div>
  );
}