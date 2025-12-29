import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/dist/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo } from "react";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);

export default function ProfessionalCalendar({ slots, professionalId, handleDeleteSlot }) {
  const events = useMemo(() => {
    return (
      slots?.map((s) => ({
        id: s.id,
        title: s.services?.name || "Serviço removido",
        start: new Date(s.time),
        end: new Date(new Date(s.time).getTime() + 30 * 60000), // 30 minutos
        resource: { professionalId },
        // Dados extras para tooltip
        serviceName: s.services?.name || "Serviço removido",
        rawTime: s.time,
      })) || []
    );
  }, [slots]);

  const messages = {
    allDay: "Dia inteiro",
    previous: "Anterior",
    next: "Próximo",
    today: "Hoje",
    month: "Mês",
    week: "Semana",
    day: "Dia",
    agenda: "Agenda",
    date: "Data",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "Não há agendamentos neste período.",
    showMore: (total) => `+ Ver mais (${total})`,
  };

  const formats = {
    timeGutterFormat: "HH:mm",
    eventTimeRangeFormat: ({ start, end }, culture, local) =>
      local.format(start, "HH:mm", culture) + " – " + local.format(end, "HH:mm", culture),
    selectRangeFormat: ({ start, end }, culture, local) =>
      local.format(start, "HH:mm", culture) + " – " + local.format(end, "HH:mm", culture),
    agendaTimeRangeFormat: ({ start, end }, culture, local) =>
      local.format(start, "HH:mm", culture) + " – " + local.format(end, "HH:mm", culture),
    dayHeaderFormat: "dddd, D [de] MMMM",
    dayRangeHeaderFormat: ({ start, end }, culture, local) =>
      local.format(start, "DD/MM", culture) + " a " + local.format(end, "DD/MM", culture),
  };

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: "#DBC4C4",
      color: "#403D39",
      borderRadius: "6px",
      border: "none",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      fontSize: "0.9rem",
      fontWeight: "500",
      opacity: event.start < new Date() ? 0.65 : 1, // Passado mais suave
    },
  });

  // Componente customizado para evento (melhor tooltip)
  const CustomEvent = ({ event }) => (
    <div>
      <strong>{event.title}</strong>
      <br />
      <small>{moment(event.start).format("HH:mm")} - {moment(event.end).format("HH:mm")}</small>
    </div>
  );

  return (
    <div style={{ height: 500, width: "100%", overflowX: "auto" }}>
      <div style={{ minWidth: "600px", height: "100%" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          views={["week", "day"]}
          defaultView={window.innerWidth < 768 ? "day" : "week"} // Responsivo
          messages={messages}
          formats={formats}
          culture="pt-BR"
          min={new Date(1970, 1, 1, 8, 0)} // 08:00
          max={new Date(1970, 1, 1, 20, 0)} // 20:00
          onSelectEvent={(event) => handleDeleteSlot(event.id, professionalId)}
          eventPropGetter={eventStyleGetter}
          components={{ event: CustomEvent }}
          tooltipAccessor="title"
        />
      </div>
    </div>
  );
}