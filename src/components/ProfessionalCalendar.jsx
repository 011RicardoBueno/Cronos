import React, { useMemo, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "moment/dist/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

export default function ProfessionalCalendar({ 
  slots, 
  handleDeleteSlot, 
  handleMoveSlot,
  openingTime,
  closingTime 
}) {
  
  const getBusinessHour = (timeStr, defaultHour) => {
    const date = new Date();
    if (!timeStr) {
      date.setHours(defaultHour, 0, 0);
      return date;
    }
    const [hours, minutes] = timeStr.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0);
    return date;
  };

  const events = useMemo(() => {
    return (slots || []).map(slot => ({
      id: slot.id,
      title: slot.client_name || slot.services?.name || "Agendamento",
      start: new Date(slot.start_time || slot.time),
      end: slot.end_time 
        ? new Date(slot.end_time) 
        : new Date(new Date(slot.start_time || slot.time).getTime() + 30 * 60000),
    })).filter(e => !isNaN(e.start.getTime()));
  }, [slots]);

  // Função para detectar colisão de horários
  const isSlotConflict = (start, end, excludeId) => {
    return events.some(event => {
      if (event.id === excludeId) return false;
      // Lógica de colisão: (NovoInicio < EventoFim) E (NovoFim > EventoInicio)
      return start < event.end && end > event.start;
    });
  };

  const onEventDrop = useCallback(({ event, start, end }) => {
    const now = new Date();

    // 1. Validar se é passado
    if (start < now) {
      alert("Operação inválida: Não é possível mover agendamentos para o passado.");
      return;
    }

    // 2. Validar se o evento original já passou (bloquear edição de histórico)
    if (event.start < now) {
      alert("Não é permitido mover agendamentos que já foram realizados.");
      return;
    }

    // 3. Validar conflito de horário
    if (isSlotConflict(start, end, event.id)) {
      alert("Conflito de agenda: Já existe um agendamento neste horário.");
      return;
    }

    handleMoveSlot({
      slotId: event.id,
      newStart: start,
      newEnd: end
    });
  }, [handleMoveSlot, events]);

  // Estilização dinâmica
  const eventStyleGetter = (event) => {
    const isPast = event.start < new Date();
    return {
      style: {
        backgroundColor: isPast ? "#E5E5E5" : "#DBC4C4",
        color: isPast ? "#999999" : "#403D39",
        borderRadius: "6px",
        border: 'none',
        opacity: isPast ? 0.7 : 1,
        cursor: isPast ? "not-allowed" : "grab",
        textDecoration: isPast ? "line-through" : "none"
      }
    };
  };

  return (
    <div style={{ height: "600px" }}>
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="day"
        views={['week', 'day']}
        culture="pt-BR"
        onEventDrop={onEventDrop}
        onSelectEvent={(event) => {
          // Também bloqueia deletar passado se quiser ser rigoroso
          if (event.start < new Date()) {
            alert("Para manter o histórico, agendamentos passados não podem ser removidos.");
            return;
          }
          handleDeleteSlot(event.id);
        }}
        min={getBusinessHour(openingTime, 8)}
        max={getBusinessHour(closingTime, 20)}
        resizable={false}
        messages={{
          today: "Hoje",
          previous: "Anterior",
          next: "Próximo",
          week: "Semana",
          day: "Dia",
          noEventsInRange: "Sem agendamentos."
        }}
        eventPropGetter={eventStyleGetter}
        style={{ height: "100%" }}
      />
    </div>
  );
}