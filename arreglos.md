# MyOrbita — Arreglos y Mejoras Pendientes

Documento de instrucciones para corregir problemas detectados en el código actual.
Aplicar en orden de prioridad (críticos primero).

---

## 1. CRÍTICO — Cambiar `to_tsquery` por `websearch_to_tsquery`

**Archivo:** `src/lib/search-in-book.ts`

**Problema:** `to_tsquery` requiere sintaxis especial y lanza errores si el usuario escribe caracteres como `!`, `:`, `&`, `(`, etc. Además estás construyendo manualmente los operadores OR con `|`, lo cual es frágil.

**Solución:** Reemplazar `to_tsquery` por `websearch_to_tsquery` que acepta texto libre del usuario sin sintaxis especial.

**Cambiar esto (líneas ~30-50 aprox):**

```typescript
// ANTES (problemático)
const terms = trimmed.split(/\s+/).filter(w => w.length > 1).join(" | ");
if (!terms) return [];

const params: (string | number)[] = [terms, limit, bookId];

const results = (await prisma.$queryRawUnsafe(
  `
  SELECT ...
  CROSS JOIN to_tsquery('spanish', $1) q
  WHERE bf.search_vector @@ q AND b.id = $3 AND b.status = 'READY'
  ORDER BY relevance DESC
  LIMIT $2
  `,
  ...params
)) as SearchInBookResult[];
```

**Por esto:**

```typescript
// DESPUÉS (seguro)
const params: (string | number)[] = [trimmed, limit, bookId];

const results = (await prisma.$queryRawUnsafe(
  `
  SELECT
    bf.id,
    bf."pageNumber",
    bf.position,
    bf.content,
    b.id AS "bookId",
    b.title AS "bookTitle",
    b."fileUrl",
    b."totalPages" AS "totalPages",
    ts_rank_cd(bf.search_vector, q) AS relevance,
    ts_headline('spanish', bf.content, q,
      'StartSel=<mark>, StopSel=</mark>, MaxWords=80, MinWords=25'
    ) AS highlighted
  FROM "BookFragment" bf
  JOIN "Book" b ON b.id = bf."bookId"
  CROSS JOIN websearch_to_tsquery('spanish', $1) q
  WHERE bf.search_vector @@ q AND b.id = $3 AND b.status = 'READY'
  ORDER BY relevance DESC
  LIMIT $2
  `,
  ...params
)) as SearchInBookResult[];
```

Ya no necesitas la línea de `const terms = ...` ni el split con `|`. Pasa `trimmed` directo.

**Mismo cambio en:** `src/app/api/books/search/route.ts`

Cambiar `plainto_tsquery` por `websearch_to_tsquery` también ahí:

```typescript
// ANTES
CROSS JOIN plainto_tsquery('spanish', $1) query

// DESPUÉS
CROSS JOIN websearch_to_tsquery('spanish', $1) query
```

`websearch_to_tsquery` es superior a `plainto_tsquery` porque interpreta comillas como frase exacta y guiones como exclusión, sin requerir sintaxis de operadores.

---

## 2. CRÍTICO — Corregir extracción de páginas en PDF Processor

**Archivo:** `src/lib/pdf-processor.ts`

**Problema:** El `split('\n\n')` sobre todo el texto concatenado pierde los límites reales entre páginas. Los `pageNumber` asignados a los fragmentos no son confiables — un fragmento de la página 5 puede quedar marcado como página 3.

**Solución:** Capturar el texto por página individualmente usando un array externo.

**Reemplazar todo el contenido de `src/lib/pdf-processor.ts` por:**

```typescript
import { readFile } from "fs/promises";

function getPdfParse(): (buffer: Buffer, options?: any) => Promise<{ text: string; numpages: number }> {
  return require("pdf-parse");
}

export interface ExtractedFragment {
  pageNumber: number;
  position: number;
  content: string;
}

export async function extractPdfFragments(filePath: string): Promise<{
  totalPages: number;
  fragments: ExtractedFragment[];
}> {
  const buffer = await readFile(filePath);
  const fragments: ExtractedFragment[] = [];

  const pdfParse = getPdfParse();

  // Array externo para capturar texto por página individual
  const pageTexts: string[] = [];

  const render_page = async (pageData: any) => {
    const textContent = await pageData.getTextContent({
      normalizeWhitespace: true,
      disableCombineTextItems: false,
    });

    let text = "";
    for (const item of textContent.items) {
      // Detectar saltos de línea implícitos por cambio de posición Y
      if (item.hasEOL) {
        text += "\n";
      }
      text += item.str;
    }

    const cleaned = text.trim();
    pageTexts.push(cleaned);
    return cleaned;
  };

  const data = await pdfParse(buffer, { pagerender: render_page });

  // Ahora pageTexts[0] = página 1, pageTexts[1] = página 2, etc.
  for (let i = 0; i < pageTexts.length; i++) {
    const pageText = pageTexts[i];
    if (!pageText || pageText.length < 10) continue;

    // Intentar dividir en párrafos naturales (doble salto de línea)
    const rawParagraphs = pageText.split(/\n\s*\n/);

    let position = 0;
    for (const paragraph of rawParagraphs) {
      const cleaned = paragraph.replace(/\s+/g, " ").trim();

      if (cleaned.length < 20) continue;

      // Si un párrafo es muy largo (>800 chars), subdividir por oraciones
      if (cleaned.length > 800) {
        const sentences = cleaned.match(/[^.!?]+[.!?]+\s*/g) || [cleaned];
        let chunk = "";

        for (const sentence of sentences) {
          if ((chunk + sentence).length > 800 && chunk.length >= 20) {
            position++;
            fragments.push({
              pageNumber: i + 1,
              position,
              content: chunk.trim(),
            });
            chunk = sentence;
          } else {
            chunk += sentence;
          }
        }

        if (chunk.trim().length >= 20) {
          position++;
          fragments.push({
            pageNumber: i + 1,
            position,
            content: chunk.trim(),
          });
        }
      } else {
        position++;
        fragments.push({
          pageNumber: i + 1,
          position,
          content: cleaned,
        });
      }
    }
  }

  return {
    totalPages: data.numpages,
    fragments,
  };
}
```

**Cambios clave:**
- `pageTexts[]` array externo captura texto por página de forma individual
- `pageNumber: i + 1` ahora es correcto porque `pageTexts[0]` = página 1
- Fragmentación inteligente: primero intenta párrafos naturales, luego subdivide los largos por oraciones
- Ya no depende de `split('\n\n')` sobre texto concatenado

**IMPORTANTE:** Después de aplicar este cambio, hay que re-indexar los libros existentes. Crear un script o endpoint para eso:

**Crear archivo:** `src/app/api/books/reindex/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractPdfFragments } from "@/lib/pdf-processor";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const books = await prisma.book.findMany({
    where: { status: "READY" },
  });

  const results = [];

  for (const book of books) {
    const filePath = path.join(UPLOAD_DIR, "books", path.basename(book.fileUrl));

    try {
      // Borrar fragmentos existentes
      await prisma.bookFragment.deleteMany({ where: { bookId: book.id } });

      // Re-extraer
      const { totalPages, fragments } = await extractPdfFragments(filePath);

      // Insertar en batches
      for (let i = 0; i < fragments.length; i += 100) {
        const batch = fragments.slice(i, i + 100);
        await prisma.bookFragment.createMany({
          data: batch.map((f) => ({
            bookId: book.id,
            pageNumber: f.pageNumber,
            position: f.position,
            content: f.content,
          })),
        });
      }

      await prisma.book.update({
        where: { id: book.id },
        data: { totalPages },
      });

      results.push({ id: book.id, title: book.title, fragments: fragments.length, ok: true });
    } catch (err) {
      console.error(`[Reindex] Error en ${book.id}:`, err);
      results.push({ id: book.id, title: book.title, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({ reindexed: results.length, results });
}
```

**Ejecutar re-indexación (una vez, después de aplicar el fix):**

```bash
# Local (Windows)
curl -X POST "http://localhost:3000/api/books/reindex?secret=TU_CRON_SECRET"
```

---

## 3. CRÍTICO — Validar inputs con Zod en API routes

**Archivo:** `src/app/api/ai/chat/route.ts`

**Problema:** `bookId` y `message` se extraen del body sin validación de tipo/formato. Un `bookId` malformado podría causar errores en la DB.

**Agregar al inicio del archivo, después de los imports:**

```typescript
import { z } from "zod";

const chatSchema = z.object({
  bookId: z.string().min(1).max(100),
  message: z.string().min(2).max(1000),
});
```

**Reemplazar la extracción del body:**

```typescript
// ANTES
const body = await req.json();
const { bookId, message } = body;

// DESPUÉS
const body = await req.json();
const parsed = chatSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Datos inválidos: " + parsed.error.issues[0]?.message },
    { status: 400 }
  );
}

const { bookId, message } = parsed.data;
```

Y eliminar las validaciones manuales que ya no hacen falta (los `if (!bookId)` y `if (!message)`).

**Mismo patrón aplicar en:** `src/app/api/books/search/route.ts` para el query param `q`.

---

## 4. IMPORTANTE — Actualizar textos de UI (no hay IA)

**Archivo:** `src/app/dashboard/search/page.tsx`

**Problema:** La UI promete "Asistente IA", "pregúntale a Gemini", "Conversa con tus Documentos" pero el endpoint solo hace búsqueda full-text sin IA.

**Cambiar estos textos:**

```typescript
// ANTES
<div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
  <svg .../>
  Asistente IA
</div>

<h1 ...>Conversa con tus Documentos</h1>

<p ...>
  Selecciona un documento de tu biblioteca y pregúntale a Gemini cualquier concepto o resumen que necesites.
</p>

// DESPUÉS
<div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
  <svg .../>
  Búsqueda Inteligente
</div>

<h1 ...>Busca en tus Documentos</h1>

<p ...>
  Selecciona un documento de tu biblioteca y busca cualquier concepto, definición o término dentro de su contenido.
</p>
```

**Archivo:** `src/app/dashboard/search/search-page-client.tsx`

Cambiar los textos del empty state y del footer:

```typescript
// Empty state cuando hay libro seleccionado — ANTES
<h3 ...>Listo para buscar</h3>
<p ...>
  Escribe una palabra clave o una frase para buscar coincidencias exactas y semánticas dentro del documento.
</p>

// DESPUÉS
<h3 ...>Listo para buscar</h3>
<p ...>
  Escribe una palabra clave o frase. El sistema buscará coincidencias en todo el contenido del documento.
</p>

// Footer — ANTES
<Search className="size-3" /> Búsqueda en el sistema de documentos

// DESPUÉS (sin cambios necesarios, este texto ya es correcto)
```

**Archivo:** `src/app/dashboard/page.tsx`

En el módulo de búsqueda del dashboard:

```typescript
// ANTES
title: "Búsqueda Global Inteligente",
description: "Encuentra cualquier concepto dentro de todos tus PDFs al instante",
detail: "Ir al buscador con IA",

// DESPUÉS
title: "Búsqueda Global",
description: "Encuentra cualquier concepto dentro de todos tus PDFs al instante",
detail: "Ir al buscador",
```

---

## 5. IMPORTANTE — Polling para estado de procesamiento de PDFs

**Archivo:** Crear `src/app/api/books/[id]/status/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
    select: { id: true, status: true, totalPages: true },
  });

  if (!book) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(book);
}
```

**Archivo:** `src/components/books/book-card.tsx`

Agregar polling cuando el libro está en `PROCESSING`:

```typescript
// Agregar imports
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Dentro del componente BookCard, antes del return:
export function BookCard({ book, onDeleteClick }: BookCardProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(book.status);

  useEffect(() => {
    if (currentStatus !== "PROCESSING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/books/${book.id}/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status !== "PROCESSING") {
          setCurrentStatus(data.status);
          clearInterval(interval);
          router.refresh(); // Recargar datos del servidor
        }
      } catch {
        // Silenciar errores de red
      }
    }, 3000); // Cada 3 segundos

    return () => clearInterval(interval);
  }, [currentStatus, book.id, router]);

  // Usar currentStatus en vez de book.status en el render
  // ...
}
```

---

## 6. IMPORTANTE — Crear endpoint de cron para recordatorios Telegram

**Archivo:** Crear `src/app/api/cron/reminders/route.ts`

```typescript
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

      // Marcar como enviado aunque haya fallado (para no reintentar infinitamente)
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
```

**Nota:** Este endpoint usa `fetch` directamente a la API de Telegram en vez de `telegraf` para evitar problemas de inicialización del bot en serverless. Es más simple y confiable.

**Configurar cron en producción (VPS):**

```bash
# Agregar al crontab
crontab -e

# Ejecutar cada minuto
* * * * * curl -s "http://localhost:3001/api/cron/reminders?secret=myorbita-cron-2026-secreto" > /dev/null 2>&1
```

---

## 7. MEJORA — Mostrar ratio de compresión en BookCard

**Archivo:** `src/lib/types/index.ts`

No necesita cambios — `originalSize` ya está en `BookForList`.

**Archivo:** `src/components/books/book-card.tsx`

Agregar después del badge de páginas, dentro del `CardContent`:

```typescript
{/* Tamaño y compresión */}
<div className="flex items-center gap-2 text-xs text-muted-foreground/70">
  <span>{(book.fileSize / 1024 / 1024).toFixed(1)} MB</span>
  {book.originalSize && book.originalSize > book.fileSize && (
    <span className="inline-flex items-center gap-1 text-[var(--success)] bg-[var(--success-light)] px-1.5 py-0.5 rounded text-[10px] font-medium">
      -{Math.round((1 - book.fileSize / book.originalSize) * 100)}%
    </span>
  )}
</div>
```

---

## 8. MEJORA — Página de configuración de Telegram

**Archivo:** `src/app/dashboard/settings/page.tsx`

Reemplazar el placeholder actual por una página funcional:

```typescript
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
```

**Crear:** `src/components/settings/telegram-settings.tsx`

```typescript
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

  // En producción, generar un código temporal. Por ahora, link directo.
  const botUsername = "myorbita_cloud_bot"; // Cambiar al username real del bot
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
```

---

## 9. MEJORA — Webhook de Telegram con fetch (sin telegraf en serverless)

**Archivo:** Crear o reemplazar `src/app/api/telegram/webhook/route.ts`

```typescript
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

    // Comando /start (vincular cuenta)
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

    // Comando /silenciar
    if (text === "/silenciar") {
      await prisma.telegramConfig.updateMany({
        where: { chatId },
        data: { isActive: false },
      });
      await sendTelegramMessage(token, chatId, "🔇 Recordatorios desactivados. Usa /activar para reactivar.");
      return NextResponse.json({ ok: true });
    }

    // Comando /activar
    if (text === "/activar") {
      await prisma.telegramConfig.updateMany({
        where: { chatId },
        data: { isActive: true },
      });
      await sendTelegramMessage(token, chatId, "🔔 Recordatorios activados.");
      return NextResponse.json({ ok: true });
    }

    // Comando /estado
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

    // Mensaje no reconocido
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
```

**Ventaja:** No depende de `telegraf` en runtime. Usa `fetch` directo a la API de Telegram, más simple y compatible con serverless/edge.

**Registrar webhook en producción (ejecutar una vez):**

```bash
curl -X POST "https://api.telegram.org/botTU_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://myorbita.cloud/api/telegram/webhook"}'
```

---

## Resumen — Orden de aplicación

| # | Tipo | Descripción | Archivos |
|---|------|-------------|----------|
| 1 | CRÍTICO | `websearch_to_tsquery` | `search-in-book.ts`, `search/route.ts` |
| 2 | CRÍTICO | Extracción de páginas PDF | `pdf-processor.ts` + crear `reindex/route.ts` |
| 3 | CRÍTICO | Validación Zod en APIs | `ai/chat/route.ts` |
| 4 | IMPORTANTE | Actualizar textos UI (no hay IA) | `search/page.tsx`, `search-page-client.tsx`, `dashboard/page.tsx` |
| 5 | IMPORTANTE | Polling status de procesamiento | Crear `[id]/status/route.ts`, editar `book-card.tsx` |
| 6 | IMPORTANTE | Cron de recordatorios Telegram | Crear `cron/reminders/route.ts` |
| 7 | MEJORA | Mostrar compresión en cards | `book-card.tsx` |
| 8 | MEJORA | Settings Telegram funcional | `settings/page.tsx` + crear `telegram-settings.tsx` |
| 9 | MEJORA | Webhook Telegram con fetch | Crear/reemplazar `telegram/webhook/route.ts` |

Aplicar los críticos primero (1-3), luego importantes (4-6), luego mejoras (7-9).