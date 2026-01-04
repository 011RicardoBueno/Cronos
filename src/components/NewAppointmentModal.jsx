import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { IMaskInput } from 'react-imask';
import { X, Save, Loader2, User, Phone, Scissors, Calendar, Clock, Search, Check, ShieldAlert } from 'lucide-react';
import Button from './ui/Button';

export default function NewAppointmentModal({ isOpen, onClose, salonId, professionals, services, currentDate, onSuccess, salon }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    client_id: null,
    client_name: '',
    client_phone: '',
    service_id: '',
    professional_id: '',
    date: currentDate.format('YYYY-MM-DD'),
    time: '09:00',
    notes: '',
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState({
    frequency: 'weekly',
    endDate: moment().add(1, 'month').format('YYYY-MM-DD'),
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const [availability, setAvailability] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  useEffect(() => {
    // Reset form when modal is opened with a new date
    setFormData(prev => ({
      ...prev,
      date: currentDate.format('YYYY-MM-DD'),
      client_id: null,
      client_name: '',
      client_phone: '',
      notes: '',
    }));
    setSearchTerm('');
    setIsRecurring(false);
  }, [isOpen, currentDate]);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, phone')
          .eq('salon_id', salonId)
          .ilike('name', `%${searchTerm}%`)
          .limit(5);
        if (error) throw error;
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching clients:", error);
        toast.error("Erro ao buscar clientes.");
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, salonId]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!formData.professional_id) {
        setAvailability({});
        return;
      }
      setAvailabilityLoading(true);
      try {
        const startDate = moment().startOf('day');
        const endDate = moment().add(7, 'days').endOf('day');

        const { data, error } = await supabase
          .from('slots')
          .select('start_time')
          .eq('professional_id', formData.professional_id)
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());

        if (error) throw error;

        const availabilityMap = data.reduce((acc, slot) => {
          const day = moment(slot.start_time).format('YYYY-MM-DD');
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {});

        setAvailability(availabilityMap);
      } catch (err) {
        console.error("Error fetching availability:", err);
      } finally {
        setAvailabilityLoading(false);
      }
    };
    fetchAvailability();
  }, [formData.professional_id, salonId]);

  useEffect(() => {
    const fetchOccupiedSlots = async () => {
      if (!formData.professional_id || !formData.date) {
        setOccupiedSlots([]);
        return;
      }
      try {
        const startOfDay = moment(formData.date).startOf('day').toISOString();
        const endOfDay = moment(formData.date).endOf('day').toISOString();

        const { data, error } = await supabase
          .from('slots')
          .select('start_time, end_time')
          .eq('professional_id', formData.professional_id)
          .gte('start_time', startOfDay)
          .lt('end_time', endOfDay);
        
        if (error) throw error;
        setOccupiedSlots(data || []);
      } catch (err) {
        console.error("Error fetching occupied slots:", err);
      }
    };
    fetchOccupiedSlots();
  }, [formData.professional_id, formData.date]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { client_name, client_phone, service_id, professional_id, date, time, client_id, notes } = formData;
      
      // Impede agendamentos no passado
      const startDateTimeValidation = moment(`${date} ${time}`);
      if (startDateTimeValidation.isBefore(moment())) {
        throw new Error("Não é possível criar agendamentos em datas ou horários passados.");
      }

      let finalClientId = client_id;
      const cleanPhone = (client_phone || '').replace(/\D/g, "");

      // If no client was selected from search, try to find/create one
      if (!finalClientId && client_name) {
        if (cleanPhone) {
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('salon_id', salonId)
            .eq('phone', cleanPhone)
            .maybeSingle();
          if (existingClient) finalClientId = existingClient.id;
        }
        
        if (!finalClientId) {
          const { data: newClient, error: createError } = await supabase
            .from('clients')
            .insert({ salon_id: salonId, name: client_name, phone: cleanPhone })
            .select('id')
            .single();
          if (createError) throw createError;
          finalClientId = newClient.id;
        }
      }

      const selectedService = services.find(s => s.id === service_id);
      if (!selectedService) {
        throw new Error("Serviço selecionado é inválido.");
      }
      const duration = selectedService.duration_minutes || 30;

      const slotsToInsert = [];
      const initialStartDateTime = moment(`${date} ${time}`);

      if (isRecurring) {
        const finalEndDate = moment(recurrence.endDate).endOf('day');
        let nextDate = initialStartDateTime.clone();
        let occurrenceCount = 0;

        if (initialStartDateTime.isAfter(finalEndDate)) {
          throw new Error("A data final da recorrência deve ser após a data de início.");
        }

        while (nextDate.isSameOrBefore(finalEndDate)) {
          occurrenceCount++;
          if (occurrenceCount > 52) { // Safety break for 1 year of weekly appointments
            toast.error("Limite de 52 repetições atingido.");
            break;
          }

          const startDateTime = nextDate.clone();
          const endDateTime = startDateTime.clone().add(duration, 'minutes');

          // Conflict check for each occurrence
          const { data: conflicts, error: conflictError } = await supabase.from('slots')
            .select('id')
            .eq('professional_id', professional_id)
            .lt('start_time', endDateTime.toISOString())
            .gt('end_time', startDateTime.toISOString());

          if (conflictError) throw conflictError;
          if (conflicts && conflicts.length > 0) {
            throw new Error(`Conflito na ocorrência de ${startDateTime.format('DD/MM/YYYY')}.`);
          }

          slotsToInsert.push({
            salon_id: salonId,
            professional_id,
            service_id,
            client_id: finalClientId,
            client_name,
            client_phone: cleanPhone,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            status: 'confirmed',
            notes: notes,
          });

          // Increment for next iteration
          if (recurrence.frequency === 'weekly') {
            nextDate.add(1, 'week');
          } else if (recurrence.frequency === 'bi-weekly') {
            nextDate.add(2, 'weeks');
          } else { // monthly
            nextDate.add(1, 'month');
          }
        }
      } else {
        // Single appointment logic
        const endDateTime = initialStartDateTime.clone().add(duration, 'minutes');
        const { data: conflicts, error: conflictError } = await supabase.from('slots')
          .select('id')
          .eq('professional_id', professional_id)
          .lt('start_time', endDateTime.toISOString())
          .gt('end_time', initialStartDateTime.toISOString());

        if (conflictError) throw conflictError;
        if (conflicts && conflicts.length > 0) {
          throw new Error(`Conflito de horário em ${initialStartDateTime.format('DD/MM')}.`);
        }

        slotsToInsert.push({
          salon_id: salonId,
          professional_id,
          service_id,
          client_id: finalClientId,
          client_name,
          client_phone: cleanPhone,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'confirmed',
          notes: notes,
        });
      }

      if (slotsToInsert.length === 0) {
        throw new Error("Nenhum agendamento válido para criar. Verifique a data final da recorrência.");
      }

      // Insert all slots at once
      const { error: insertError } = await supabase.from('slots').insert(slotsToInsert);

      if (insertError) throw insertError;

      toast.success(slotsToInsert.length > 1 ? `${slotsToInsert.length} agendamentos criados!` : 'Agendamento criado com sucesso!');
      onSuccess();
      onClose();

    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error(error.message || "Não foi possível criar o agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setSearchTerm(name);
    setFormData(prev => ({
      ...prev,
      client_name: name,
      client_id: null // Reset client_id if user types a new name
    }));
  };

  const handleSelectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      client_name: client.name,
      client_phone: client.phone || ''
    }));
    setSearchTerm(client.name);
    setShowResults(false);
  };

  const availableTimeSlots = useMemo(() => {
    if (!salon || !formData.service_id || !formData.professional_id || !formData.date) return [];

    const selectedService = services.find(s => s.id === formData.service_id);
    if (!selectedService) return [];

    const serviceDuration = selectedService.duration_minutes || 30;
    const timeSlots = [];
    const start = moment(formData.date).set({ 
      hour: parseInt((salon.opening_time || '08:00').split(':')[0]), 
      minute: 0 
    });
    const end = moment(formData.date).set({ 
      hour: parseInt((salon.closing_time || '20:00').split(':')[0]), 
      minute: 0 
    });

    let current = start.clone();
    while (current.isBefore(end)) {
      const slotStart = current.clone();
      const slotEnd = current.clone().add(serviceDuration, 'minutes');

      const isOccupied = occupiedSlots.some(occupied => 
        slotStart.isBefore(moment(occupied.end_time)) && slotEnd.isAfter(moment(occupied.start_time))
      );

      if (!isOccupied && slotEnd.isSameOrBefore(end)) {
        timeSlots.push(slotStart.format('HH:mm'));
      }
      current.add(15, 'minutes'); // Check every 15 minutes for availability
    }
    return timeSlots;
  }, [salon, formData.service_id, formData.professional_id, formData.date, occupiedSlots, services]);

  const recurringDates = useMemo(() => {
    if (!isRecurring || !formData.date || !formData.time || !recurrence.endDate) return [];

    const dates = [];
    const initialStartDateTime = moment(`${formData.date} ${formData.time}`);
    const finalEndDate = moment(recurrence.endDate).endOf('day');
    let nextDate = initialStartDateTime.clone();
    let occurrenceCount = 0;

    if (initialStartDateTime.isAfter(finalEndDate)) return [];

    while (nextDate.isSameOrBefore(finalEndDate)) {
      occurrenceCount++;
      if (occurrenceCount > 52) break; // Safety break

      dates.push(nextDate.format('DD/MM/YYYY'));

      // Increment for next iteration
      if (recurrence.frequency === 'weekly') {
        nextDate.add(1, 'week');
      } else if (recurrence.frequency === 'bi-weekly') {
        nextDate.add(2, 'weeks');
      } else { // monthly
        nextDate.add(1, 'month');
      }
    }
    return dates;
  }, [isRecurring, recurrence.endDate, recurrence.frequency, formData.date, formData.time]);

  const handlePreviewConflicts = async () => {
    if (!isRecurring) return;
    setCheckingConflicts(true);

    try {
      const { professional_id, service_id } = formData;
      const selectedService = services.find(s => s.id === service_id);
      if (!selectedService) throw new Error("Selecione um serviço primeiro.");
      
      const duration = selectedService.duration_minutes || 30;
      const datesToCheck = recurringDates.map(dateStr => moment(dateStr, 'DD/MM/YYYY').set({
        hour: moment(formData.time, 'HH:mm').hour(),
        minute: moment(formData.time, 'HH:mm').minute()
      }));

      for (const date of datesToCheck) {
        const startDateTime = date.clone();
        const endDateTime = startDateTime.clone().add(duration, 'minutes');

        const { data: conflicts, error: conflictError } = await supabase.from('slots')
          .select('id')
          .eq('professional_id', professional_id)
          .lt('start_time', endDateTime.toISOString())
          .gt('end_time', startDateTime.toISOString());

        if (conflictError) throw conflictError;
        if (conflicts && conflicts.length > 0) {
          throw new Error(`Conflito encontrado em ${startDateTime.format('DD/MM/YYYY')}.`);
        }
      }

      toast.success('Nenhum conflito encontrado para as datas recorrentes!', {
        icon: <Check className="text-green-500" />,
      });

    } catch (error) {
      console.error("Conflict check error:", error);
      toast.error(error.message || "Erro ao verificar conflitos.", {
        icon: <ShieldAlert className="text-yellow-500" />,
      });
    } finally {
      setCheckingConflicts(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
      {/* Restructured modal panel with flexbox for sticky header/footer */}
      <div className="bg-brand-card rounded-3xl w-full max-w-lg m-4 shadow-2xl border border-brand-muted/10 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex-shrink-0 p-6 pb-4">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-brand-muted hover:bg-brand-surface rounded-full transition-colors">
            <X size={20} />
          </button>
          <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <Calendar className="text-brand-primary" /> Novo Agendamento
          </h3>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 pb-6 flex-grow">
          <form id="new-appointment-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative" ref={searchRef}>
                <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Nome do Cliente</label>
                <div className="relative">
                  <input
                    placeholder="Digite para buscar ou criar"
                    value={formData.client_name}
                    onChange={handleNameChange}
                    required
                    autoComplete="off"
                    className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
                  />
                  {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-muted" />}
                </div>
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-20 w-full bg-brand-surface border border-brand-muted/20 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map(client => (
                      <div key={client.id} onClick={() => handleSelectClient(client)} className="p-3 hover:bg-brand-primary/10 cursor-pointer border-b border-brand-muted/5 last:border-0">
                        <p className="font-semibold text-brand-text text-sm">{client.name}</p>
                        {client.phone && <p className="text-xs text-brand-muted">{client.phone}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Telefone</label>
                <IMaskInput
                  mask="(00) 00000-0000"
                  placeholder="(00) 00000-0000"
                  value={formData.client_phone}
                  onAccept={(value) => setFormData(prev => ({...prev, client_phone: value}))}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Serviço</label>
              <select
                value={formData.service_id}
                onChange={e => setFormData({...formData, service_id: e.target.value})}
                required
                className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
              >
                <option value="">Selecione um serviço...</option>
                {services?.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {Number(s.price).toFixed(2)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Profissional</label>
              <select
                value={formData.professional_id}
                onChange={e => setFormData({...formData, professional_id: e.target.value})}
                required
                className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
              >
                <option value="">Selecione um profissional...</option>
                {professionals?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Observações (Interno)</label>
              <textarea
                placeholder="Alergias, preferências do cliente, etc."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                rows="2"
                className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
              />
            </div>

            {/* Recurrence Section */}
            <div className="pt-4 border-t border-brand-muted/10">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="font-semibold text-brand-text">Agendamento Recorrente</span>
                </label>
            </div>

            {isRecurring && (
                <div className="p-4 bg-brand-surface rounded-xl border border-brand-muted/10 animate-in fade-in space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Frequência</label>
                        <select
                            value={recurrence.frequency}
                            onChange={e => setRecurrence(prev => ({ ...prev, frequency: e.target.value }))}
                            className="w-full bg-brand-card border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
                        >
                            <option value="weekly">Semanalmente</option>
                            <option value="bi-weekly">Quinzenalmente</option>
                            <option value="monthly">Mensalmente</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Repetir até</label>
                        <input 
                          type="date" 
                          value={recurrence.endDate} 
                          onChange={e => setRecurrence(prev => ({ ...prev, endDate: e.target.value }))} 
                          className="w-full bg-brand-card border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text" 
                          min={moment(formData.date).add(1, 'day').format('YYYY-MM-DD')}
                        />
                    </div>
                  </div>
                    <div>
                        <p className="text-xs font-bold text-brand-muted uppercase mb-2">Resumo das Ocorrências:</p>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto bg-brand-card p-2 rounded-lg border border-brand-muted/10">
                            {recurringDates.map(dateStr => (
                                <span key={dateStr} className="bg-brand-card text-brand-text text-xs font-semibold px-2 py-1 rounded-md border border-brand-muted/20">
                                    {dateStr}
                                </span>
                            ))}
                            {recurringDates.length === 0 && <span className="text-xs text-brand-muted">Nenhuma data para agendar.</span>}
                        </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={handlePreviewConflicts} 
                      isLoading={checkingConflicts}
                    >
                      {checkingConflicts ? 'Verificando...' : 'Verificar Conflitos'}
                    </Button>
                </div>
            )}

            {/* Mini-calendar for availability */}
            {formData.professional_id && (
              <div className="animate-in fade-in duration-300">
                <label className="text-xs font-bold text-brand-muted uppercase mb-2 block">Disponibilidade (Próximos 7 dias)</label>
                {availabilityLoading ? (
                  <div className="flex justify-center items-center h-16"><Loader2 className="animate-spin text-brand-primary" /></div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const day = moment().add(i, 'days');
                      const dayStr = day.format('YYYY-MM-DD');
                      const appointmentsCount = availability[dayStr] || 0;
                      const isSelected = day.isSame(formData.date, 'day');
                      const isFull = appointmentsCount >= 8; // Assume 8+ appointments is a full day

                      return (
                        <button
                          type="button"
                          key={dayStr}
                          onClick={() => !isFull && setFormData(prev => ({ ...prev, date: dayStr }))}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg h-16 transition-all border-2 ${
                            isSelected ? 'border-brand-primary bg-brand-primary/10' : 'border-transparent hover:bg-brand-surface'
                          } ${isFull ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                          disabled={isFull}
                          title={isFull ? 'Dia cheio' : `${appointmentsCount} agendamentos`}
                        >
                          <span className="text-xs text-brand-muted">{day.format('ddd')}</span>
                          <span className={`font-bold text-lg ${isSelected ? 'text-brand-primary' : 'text-brand-text'}`}>{day.format('DD')}</span>
                          {appointmentsCount > 0 && !isFull && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1"></span>}
                          {isFull && <span className="w-1.s5 h-1.5 bg-red-500 rounded-full mt-1"></span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Available Time Slots */}
            {formData.professional_id && formData.service_id && (
              <div className="animate-in fade-in duration-300">
                <label className="text-xs font-bold text-brand-muted uppercase mb-2 block">Horários Disponíveis</label>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto bg-brand-surface p-2 rounded-lg">
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map(time => (
                      <button
                        type="button"
                        key={time}
                        onClick={() => setFormData(prev => ({ ...prev, time }))}
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                          formData.time === time ? 'bg-brand-primary text-white' : 'bg-brand-card hover:bg-brand-primary/20'
                        }`}
                      >
                        {time}
                      </button>
                    ))
                  ) : <p className="text-xs text-brand-muted p-2">Nenhum horário disponível para este serviço/dia.</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Horário</label>
                <input
                  type="time"
                  step="900" // 15 minutes
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                  required
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-6 pt-4 border-t border-brand-muted/10">
          <Button type="submit" form="new-appointment-form" isLoading={loading} className="w-full">
            <Save size={18} /> Salvar Agendamento
          </Button>
        </div>

      </div>
    </div>
  );
}