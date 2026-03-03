"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle, ExternalLink, Copy, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TelegramSettingsProps {
  isLinked: boolean;
  username: string | null;
  linkedAt: string | null;
}

export function TelegramSettings({ isLinked, username, linkedAt }: TelegramSettingsProps) {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState<"now" | "30s" | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testOk, setTestOk] = useState(false);

  const runTest = async (delay: number) => {
    setTestError(null);
    setTestOk(false);
    setTesting(delay === 0 ? "now" : "30s");
    try {
      const res = await fetch(`/api/telegram/test?delay=${delay}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestError(data.error ?? "Error al enviar la prueba");
        return;
      }
      setTestOk(true);
      setTimeout(() => setTestOk(false), 4000);
    } catch (e) {
      setTestError("Error de conexión");
    } finally {
      setTesting(null);
    }
  };

  const botUsername = "myorbita_cloud_bot";
  const linkUrl = `https://t.me/${botUsername}?start=link`;

  const handleCopy = () => {
    navigator.clipboard.writeText(linkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--info-light)] text-[var(--info)]">
          <Bot className="size-6" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground text-lg">Telegram Bot</h2>
          <p className="text-sm text-muted-foreground">
            Recibe recordatorios de eventos directamente en tu Telegram.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinked ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--success-light)] border border-[var(--success)]/20">
              <CheckCircle className="size-5 text-[var(--success)] shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Vinculado{username ? ` como @${username}` : ""}
                </p>
                {linkedAt && (
                  <p className="text-xs text-muted-foreground">
                    Desde {format(new Date(linkedAt), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Probar notificaciones</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTest(0)}
                  disabled={testing !== null}
                  className="gap-2"
                >
                  {testing === "now" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Enviar prueba ahora
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTest(30)}
                  disabled={testing !== null}
                  className="gap-2"
                >
                  {testing === "30s" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Enviando en 30 s…
                    </>
                  ) : (
                    "Enviar prueba en 30 segundos"
                  )}
                </Button>
              </div>
              {testError && (
                <p className="text-xs text-destructive">{testError}</p>
              )}
              {testOk && (
                <p className="text-xs text-[var(--success)]">Notificación enviada. Revisa Telegram.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aún no has vinculado tu cuenta de Telegram. Haz click en el botón para abrir el bot y vincularlo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <Bot className="size-4" />
                  Abrir Bot en Telegram
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                <Copy className="size-4" />
                {copied ? "Copiado" : "Copiar link"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
