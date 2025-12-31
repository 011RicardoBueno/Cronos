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
    return (slots || []).map(slot => {
      const start = new Date(slot.start_time || slot.time);
      // Calcula fim: usa end_time do banco ou adiciona 30 min por padrão
      const end = slot.end_time 
        ? new Date(slot.end_time) 
        : new Date(start.getTime() + 30 * 60000);

      return {
        id: slot.id,
        title: slot.client_name || slot.services?.name || "Agendamento",
        start,
        end,
        raw: slot // Mantemos o objeto original para referência se necessário
      };
    }).filter(e => !isNaN(e.start.getTime()));
  }, [slots]);

  // Função para detectar colisão de horários
  const isSlotConflict = (start, end, excludeId) => {
    return events.some(event => {
      if (event.id === excludeId) return false;
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

    // 2. Validar se o evento original já passou
    if (event.start < now) {
      alert("Não é permitido mover agendamentos que já foram realizados.");
      return;
    }

    // 3. Validar conflito
    if (isSlotConflict(start, end, event.id)) {
      alert("Conflito de agenda: Já existe um agendamento neste horário.");
      return;
    }

    // Notificamos o componente pai enviando o novo start e end
    handleMoveSlot({
      slotId: event.id,
      newStart: start,
      newEnd: end
    });
  }, [handleMoveSlot, events]);

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