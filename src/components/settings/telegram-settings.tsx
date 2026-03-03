"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle, ExternalLink, Copy } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TelegramSettingsProps {
  isLinked: boolean;
  username: string | null;
  linkedAt: string | null;
}

export function TelegramSettings({ isLinked, username, linkedAt }: TelegramSettingsProps) {
  const [copied, setCopied] = useState(false);

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
