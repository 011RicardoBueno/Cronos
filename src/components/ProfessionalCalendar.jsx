import React, { useMemo, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import { MessageCircle } from "lucide-react";
import "moment/dist/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

// --- COMPONENTE CUSTOMIZADO PARA O EVENTO ---
const CustomEvent = ({ event }) => {
  const handleWhatsApp = (e) => {
    e.stopPropagation();
    
    const phone = event.raw?.client_phone;
    if (!phone) {
      alert("Telefone do cliente não cadastrado.");
      return;
    }

    const cleanNumber = phone.replace(/\D/g, "");
    const finalNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    
    const message = encodeURIComponent(
      `Olá ${event.raw?.client_name || 'cliente'}! Confirmo seu agendamento de ${event.raw?.services?.name || 'serviço'} para o dia ${moment(event.start).format('DD/MM')} às ${moment(event.start).format('HH:mm')}.`
    );

    window.open(`https://wa.me/${finalNumber}?text=${message}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <strong>{event.title}</strong>
        {event.raw?.services?.name && (
           <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
             {event.raw.services.name}
           </div>
        )}
      </div>

      {/* Botão de WhatsApp: Visível se houver telefone */}
      {event.raw?.client_phone && (
        <button 
          onClick={handleWhatsApp}
          style={styles.whatsappBtn}
        >
          <MessageCircle size={12} />
          <span>Zap</span>
        </button>
      )}
    </div>
  );
};

export default function ProfessionalCalendar({ 
  slots, 
  handleDeleteSlot, 
  handleMoveSlot,
  min, 
  max,
  onRangeChange // Nova prop para comunicar com Agenda.jsx
}) {
  
  const events = useMemo(() => {
    console.log("PROPS SLOTS NO CALENDÁRIO:", slots);

    const processed = (slots || []).map(slot => {
      const start = moment(slot.start_time || slot.time).toDate();
      const end = slot.end_time 
        ? moment(slot.end_time).toDate() 
        : moment(start).add(30, 'minutes').toDate();

      return {
        id: slot.id,
        title: slot.client_name || slot.services?.name || "Agendamento",
        start,
        end,
        raw: slot 
      };
    }).filter(e => !isNaN(e.start.getTime()));

    console.log("EVENTOS PROCESSADOS PARA O CALENDAR:", processed);
    return processed;
  }, [slots]);

  const isSlotConflict = (start, end, excludeId) => {
    return events.some(event => {
      if (event.id === excludeId) return false;
      return start < event.end && end > event.start;
    });
  };

  const onEventDrop = useCallback(({ event, start, end }) => {
    const now = new Date();
    if (start < now) {
      alert("Operação inválida: Não é possível mover agendamentos para o passado.");
      return;
    }
    if (event.start < now) {
      alert("Não é permitido mover agendamentos que já foram realizados.");
      return;
    }
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

  const eventStyleGetter = (event) => {
    const isPast = event.start < new Date();
    return {
      style: {
        backgroundColor: isPast ? "#E5E5E5" : "#4A5D4E",
        color: isPast ? "#999999" : "white",
        borderRadius: "6px",
        border: 'none',
        opacity: isPast ? 0.7 : 1,
        cursor: isPast ? "default" : "pointer",
        textDecoration: isPast ? "line-through" : "none",
        fontSize: '0.85rem',
        padding: '2px 5px'
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
          console.log("Evento clicado no calendário:", event);
          handleDeleteSlot(event.raw);
        }}
        // Notifica a Agenda.jsx quando o usuário clica em Anterior/Próximo/Hoje
        onNavigate={(newDate) => {
          if (onRangeChange) onRangeChange(newDate);
        }}
        min={min} 
        max={max}
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
        components={{
          event: CustomEvent
        }}
        style={{ height: "100%" }}
      />
    </div>
  );
}

const styles = {
  whatsappBtn: {
    backgroundColor: '#25D366',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    padding: '2px 6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    marginTop: '4px',
    width: 'fit-content',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    zIndex: 10 // Garante que o botão fique clicável sobre o evento
  }
};