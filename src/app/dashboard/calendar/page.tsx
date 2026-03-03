import { getEvents } from "./actions";
import CalendarView from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const events = await getEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-[var(--foreground)]">
          Calendario
        </h1>
        <p className="text-[var(--foreground-secondary)]">
          Organiza tus tareas, exámenes y planifica con recordatorios por Telegram.
        </p>
      </div>

      <CalendarView events={events} />
    </div>
  );
}
