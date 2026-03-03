import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/telegram/test?delay=30
 * Envía un mensaje de prueba al chat de Telegram vinculado.
 * delay: segundos de espera antes de enviar (0 = inmediato, 30 = en 30 segundos).
 */
export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Bot no configurado (TELEGRAM_BOT_TOKEN)" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const delaySeconds = Math.min(120, Math.max(0, parseInt(searchParams.get("delay") ?? "0", 10) || 0));

  const config = await prisma.telegramConfig.findFirst({
    where: { isActive: true },
  });

  if (!config) {
    return NextResponse.json(
      { error: "No hay ninguna cuenta de Telegram vinculada" },
      { status: 400 }
    );
  }

  if (delaySeconds > 0) {
    await new Promise((r) => setTimeout(r, delaySeconds * 1000));
  }

  const message =
    "🔔 *Prueba de MyOrbita*\n\n" +
    "Si recibes este mensaje, las notificaciones del bot están funcionando correctamente.\n\n" +
    (delaySeconds > 0 ? `(Enviado ${delaySeconds} segundos después de solicitar la prueba)` : "");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Telegram no pudo enviar el mensaje", details: err },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: delaySeconds > 0 ? `Notificación enviada en ${delaySeconds} segundos` : "Notificación de prueba enviada",
    });
  } catch (err) {
    console.error("[Telegram test]", err);
    return NextResponse.json(
      { error: "Error al enviar el mensaje: " + String(err) },
      { status: 500 }
    );
  }
}
