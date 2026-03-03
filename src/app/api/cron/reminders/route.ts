import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const REMINDER_MINUTES: Record<string, number> = {
  AT_TIME: 0,
  MINUTES_15: 15,
  MINUTES_30: 30,
  HOUR_1: 60,
  HOUR_2: 120,
  DAY_1: 1440,
  DAY_2: 2880,
  DAY_3: 4320,
  WEEK_1: 10080,
};

const EVENT_ICONS: Record<string, string> = {
  EXAM: "📝",
  ASSIGNMENT: "📋",
  PRESENTATION: "🎤",
  CLASS: "📚",
  DEADLINE: "⏰",
  MEETING: "🤝",
  OTHER: "📌",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Bot no configurado" }, { status: 500 });
  }

  const now = new Date();

  const pendingReminders = await prisma.reminder.findMany({
    where: { sentAt: null },
    include: { event: true },
  });

  const telegramConfig = await prisma.telegramConfig.findFirst({
    where: { isActive: true },
  });

  if (!telegramConfig) {
    return NextResponse.json({ processed: pendingReminders.length, sent: 0, reason: "No hay Telegram vinculado" });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const reminder of pendingReminders) {
    const minutesBefore =
      reminder.type === "CUSTOM"
        ? (reminder.customMinutesBefore ?? 0)
        : (REMINDER_MINUTES[reminder.type] ?? 0);

    const sendAt = new Date(reminder.event.startDate.getTime() - minutesBefore * 60 * 1000);

    if (now >= sendAt) {
      const icon = EVENT_ICONS[reminder.event.eventType] ?? "📌";
      const eventDate = format(reminder.event.startDate, "EEEE d 'de' MMMM, HH:mm", { locale: es });

      const message =
        `${icon} *${escapeMarkdown(reminder.event.title)}*\n\n` +
        `📅 ${eventDate}\n` +
        (reminder.event.description ? `📝 ${escapeMarkdown(reminder.event.description)}\n` : "") +
        (minutesBefore > 0 ? `\n⏱ Faltan ${formatMinutes(minutesBefore)}` : "\n⏱ ¡Es ahora!");

      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramConfig.chatId,
            text: message,
            parse_mode: "Markdown",
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          const err = await res.json().catch(() => ({}));
          errors.push(`Reminder ${reminder.id}: ${JSON.stringify(err)}`);
        }
      } catch (err) {
        errors.push(`Reminder ${reminder.id}: ${String(err)}`);
      }

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sentAt: now },
      });
    }
  }

  return NextResponse.json({ processed: pendingReminders.length, sent, errors });
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hora${Math.round(minutes / 60) > 1 ? "s" : ""}`;
  if (minutes < 10080) return `${Math.round(minutes / 1440)} día${Math.round(minutes / 1440) > 1 ? "s" : ""}`;
  return `${Math.round(minutes / 10080)} semana${Math.round(minutes / 10080) > 1 ? "s" : ""}`;
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
