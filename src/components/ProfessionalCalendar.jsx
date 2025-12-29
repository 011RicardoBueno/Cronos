import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import "moment/dist/locale/pt-br";
import { useMemo, useCallback } from "react";

moment.locale("pt-br");
const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

export default function ProfessionalCalendar({
  slots,
  professionalId,
  handleDeleteSlot,
  handleMoveSlot,
}) {
  /**
   * Converte slots do banco em eventos do react-big-calendar
   */
  const events = useMemo(() => {
    return slots.map((slot) => ({
      id: slot.id,
      title: slot.services?.name || "Serviço removido",
      start: new Date(slot.time),
      end: new Date(new Date(slot.time).getTime() + 30 * 60000),
    }));
  }, [slots]);

  /**
   * Handler de Drag & Drop
   * Valida regras de negócio e delega persistência ao Dashboard
   */
  const onEventDrop = useCallback(
    ({ event, start }) => {
      const now = new Date();

      // Bloquear passado
      if (start < now) {
        alert("Não é possível mover agendamentos para o passado.");
        return;
      }

      // Bloquear fora do horário comercial
      const hour = start.getHours();
      if (hour < 8 || hour >= 20) {
        alert("Horário fora do expediente (08:00 às 20:00).");
        return;
      }

      handleMoveSlot({
        slotId: event.id,
        professionalId,
        newStart: start,
      });
    },
    [handleMoveSlot, professionalId]
  );

  const messages = {
    allDay: "Dia inteiro",
    previous: "Anterior",
    next: "Próximo",
    today: "Hoje",
    week: "Semana",
    day: "Dia",
    agenda: "Agenda",
    noEventsInRange: "Não há agendamentos neste período.",
    showMore: (total) => `+ Ver mais (${total})`,
  };

  const formats = {
    timeGutterFormat: "HH:mm",
    eventTimeRangeFormat: ({ start, end }, culture, local) =>
      `${local.format(start, "HH:mm", culture)} – ${local.format(
        end,
        "HH:mm",
        culture
      )}`,
    dayHeaderFormat: "dddd, D [de] MMMM",
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
      opacity: event.start < new Date() ? 0.6 : 1,
      cursor: "grab",
    },
  });

  const CustomEvent = ({ event }) => (
    <div>
      <strong>{event.title}</strong>
      <br />
      <small>
        {moment(event.start).format("HH:mm")} –{" "}
        {moment(event.end).format("HH:mm")}
      </small>
    </div>
  );

  return (
    <div style={{ height: 500, width: "100%", overflowX: "auto" }}>
      <div style={{ minWidth: "600px", height: "100%" }}>
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={["week", "day"]}
          defaultView={window.innerWidth < 768 ? "day" : "week"}
          culture="pt-BR"
          messages={messages}
          formats={formats}
          min={new Date(1970, 1, 1, 8, 0)}
          max={new Date(1970, 1, 1, 20, 0)}
          resizable={false}
          onEventDrop={onEventDrop}
          onSelectEvent={(event) =>
            handleDeleteSlot(event.id, professionalId)
          }
          eventPropGetter={eventStyleGetter}
          components={{ event: CustomEvent }}
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
}
