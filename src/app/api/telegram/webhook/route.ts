import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Bot no configurado" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const message = body?.message;

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const username = message.from?.username ?? null;
    const text = message.text.trim();

    if (text.startsWith("/start")) {
      await prisma.telegramConfig.upsert({
        where: { chatId },
        update: { username, isActive: true },
        create: { chatId, username, isActive: true },
      });

      await sendTelegramMessage(token, chatId,
        "✅ ¡Cuenta vinculada correctamente!\n\nRecibirás recordatorios de tus eventos aquí.\n\n" +
        "Comandos disponibles:\n" +
        "/silenciar — Desactivar recordatorios\n" +
        "/activar — Reactivar recordatorios\n" +
        "/estado — Ver estado de la conexión"
      );

      return NextResponse.json({ ok: true });
    }

    if (text === "/silenciar") {
      await prisma.telegramConfig.updateMany({
        where: { chatId },
        data: { isActive: false },
      });
      await sendTelegramMessage(token, chatId, "🔇 Recordatorios desactivados. Usa /activar para reactivar.");
      return NextResponse.json({ ok: true });
    }

    if (text === "/activar") {
      await prisma.telegramConfig.updateMany({
        where: { chatId },
        data: { isActive: true },
      });
      await sendTelegramMessage(token, chatId, "🔔 Recordatorios activados.");
      return NextResponse.json({ ok: true });
    }

    if (text === "/estado") {
      const config = await prisma.telegramConfig.findUnique({ where: { chatId } });
      if (config) {
        await sendTelegramMessage(token, chatId,
          `📊 Estado: ${config.isActive ? "Activo ✅" : "Silenciado 🔇"}\n` +
          `👤 Chat ID: ${chatId}`
        );
      } else {
        await sendTelegramMessage(token, chatId, "⚠️ No estás vinculado. Usa /start para vincular.");
      }
      return NextResponse.json({ ok: true });
    }

    await sendTelegramMessage(token, chatId,
      "No entendí ese comando. Usa:\n/silenciar, /activar o /estado"
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
