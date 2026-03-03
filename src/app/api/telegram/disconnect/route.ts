import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/telegram/disconnect
 * Desvincula la cuenta de Telegram actual (pone isActive: false).
 * Así otra persona puede vincular la suya con /start en el bot.
 */
export async function POST() {
  try {
    await prisma.telegramConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true, message: "Cuenta desvinculada" });
  } catch (err) {
    console.error("[Telegram disconnect]", err);
    return NextResponse.json(
      { error: "No se pudo desvincular" },
      { status: 500 }
    );
  }
}
