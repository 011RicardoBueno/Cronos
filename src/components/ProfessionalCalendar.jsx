import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/dist/locale/pt-br";
import { useMemo } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);

export default function ProfessionalCalendar({ slots, handleDeleteSlot, handleMoveSlot }) {
  const events = useMemo(() => {
    return slots.map(slot => ({
      id: slot.id,
      title: slot.client_name || slot.services?.name || "Agendamento",
      start: new Date(slot.start_time || slot.time),
      end: slot.end_time ? new Date(slot.end_time) : new Date(new Date(slot.start_time).getTime() + 30 * 60000),
    })).filter(e => !isNaN(e.start.getTime()));
  }, [slots]);

  return (
    <div style={{ height: 500 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="day"
        views={['week', 'day']}
        messages={{ today: "Hoje", previous: "Anterior", next: "Próximo", month: "Mês", week: "Semana", day: "Dia" }}
        onSelectEvent={(event) => handleDeleteSlot(event.id)}
        culture="pt-BR"
        min={new Date(0, 0, 0, 8, 0, 0)}
        max={new Date(0, 0, 0, 20, 0, 0)}
      />
    </div>
  );
}