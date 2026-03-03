import { prisma } from "@/lib/db";
import { TelegramSettings } from "@/components/settings/telegram-settings";

export default async function SettingsPage() {
  const config = await prisma.telegramConfig.findFirst({
    where: { isActive: true },
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-[var(--foreground)]">
          Configuración
        </h1>
        <p className="text-[var(--foreground-secondary)]">
          Gestiona la conexión con Telegram para recibir recordatorios.
        </p>
      </div>

      <TelegramSettings
        isLinked={!!config}
        username={config?.username ?? null}
        linkedAt={config?.linkedAt?.toISOString() ?? null}
      />
    </div>
  );
}
