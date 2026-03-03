"use client";

import { useState } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css"; // We will add custom overrides
import { CalendarEventInput, saveEvent, deleteEvent } from "@/app/dashboard/calendar/actions";
import EventForm from "./event-form";

const locales = {
    es: es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

const messagesEs = {
    allDay: "Todo el día",
    previous: "Atrás",
    next: "Siguiente",
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Día",
    agenda: "Eventos",
    date: "Fecha",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "No hay eventos en este rango.",
    showMore: (total: number) => `+ ver más (${total})`,
};

export type CalendarViewProps = {
    events: any[];
};

export default function CalendarView({ events }: CalendarViewProps) {
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Map backend events to react-big-calendar format (fechas en UTC/local consistentes)
    const mappedEvents = events.map(e => {
        const start = new Date(e.startDate);
        const end = e.endDate ? new Date(e.endDate) : new Date(start.getTime() + 60 * 60 * 1000);
        return {
            ...e,
            title: e.title,
            start,
            end,
            allDay: Boolean(e.allDay),
            resource: e,
        };
    });

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedEvent(null);
        setSelectedDate(start);
        setIsFormOpen(true);
    };

    const handleSelectEvent = (event: any) => {
        setSelectedEvent(event.resource);
        setSelectedDate(null);
        setIsFormOpen(true);
    };

    const handleSave = async (data: CalendarEventInput) => {
        return saveEvent(data);
    };

    const handleDelete = async (id: string) => {
        await deleteEvent(id);
    };

    // Resolver colores para buen contraste (var(--muted) es casi blanco)
    const EVENT_COLOR_MAP: Record<string, string> = {
        "var(--muted)": "#6b5e54",
        "var(--primary)": "#8b6f5c",
        "var(--destructive)": "#c45c4a",
        "var(--info)": "#6e8a9a",
        "var(--warning)": "#c49a5c",
        "var(--success)": "#7c9a6e",
    };
    const eventStyleGetter = (event: any) => {
        let bgColor = event.resource?.color || "#8b6f5c";
        bgColor = EVENT_COLOR_MAP[bgColor] ?? bgColor;
        return {
            style: {
                backgroundColor: bgColor,
                borderRadius: "6px",
                opacity: 0.95,
                color: "#fff",
                border: "none",
                display: "block",
                padding: "3px 8px",
                fontSize: "0.8125rem",
                fontWeight: 500,
            }
        };
    };

    return (
        <div className="bg-[var(--card)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border)] p-4 sm:p-6 h-[800px] flex flex-col relative">
            <div className="flex-1 w-full relative">
                <Calendar
                    localizer={localizer}
                    events={mappedEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    views={[Views.MONTH]}
                    view={view}
                    date={date}
                    onView={(v) => setView(v)}
                    onNavigate={(d) => setDate(d)}
                    messages={messagesEs}
                    culture="es"
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    popup
                />
            </div>

            {isFormOpen && (
                <EventForm
                    initialData={selectedEvent}
                    selectedDate={selectedDate || undefined}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
