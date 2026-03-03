# MyOrbita — Instructivo de Desarrollo v2.0

## Plataforma de Gestión Académica Personal

**Dominio:** myorbita.cloud
**Stack:** Next.js 15 · TypeScript · PostgreSQL · Prisma · Telegram Bot · Gemini API
**IDE:** Cursor
**Sin autenticación** — usuario único, no indexado a internet

---

## 1. Información del Proyecto

MyOrbita es una plataforma web personal para un estudiante universitario de arquitectura. Integra tres módulos principales: una biblioteca inteligente de PDFs con búsqueda full-text y explicación con IA, un calendario con recordatorios por Telegram, y un sistema de notas. No tiene autenticación porque es de uso personal y no estará expuesta públicamente.

### Estructura del proyecto (ya creada)

```
myorbita/
├── prisma/
│   ├── schema.prisma              # ✅ Ya configurado
│   └── migrations/                # ✅ Migración init aplicada
├── src/
│   ├── app/                       # Pages y API routes
│   ├── components/                # Componentes React
│   ├── hooks/                     # Custom hooks
│   └── lib/                       # Lógica de negocio
├── uploads/                       # PDFs almacenados localmente
├── .env                           # Variables de entorno
└── package.json                   # Dependencias instaladas
```

### Dependencias instaladas

```
next@15, react@19, typescript, tailwindcss@4
prisma, @prisma/client, @prisma/adapter-pg
pdf-parse, react-pdf, pdfjs-dist
telegraf
date-fns, react-big-calendar
zod, lucide-react
```

### Variables de entorno (.env)

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/myorbita"
TELEGRAM_BOT_TOKEN="token_del_bot"
GEMINI_API_KEY="api_key_de_gemini"
CRON_SECRET="clave_para_cron"
UPLOAD_DIR="./uploads"
MAX_PDF_SIZE_MB="50"
```

---

## 2. Paleta de Colores y Sistema de Diseño

### Filosofía visual

Tonos café pastel, neutros y cálidos. Paleta clara que transmite calidez académica sin ser aburrida. Estética limpia tipo Notion pero con personalidad propia a través de los tonos café/beige.

### CSS Variables (globals.css)

```css
:root {
  /* ── Fondos ─────────────────────────────── */
  --background: #faf7f2;           /* Fondo principal — crema muy suave */
  --background-secondary: #f3ede4; /* Fondo secundario — beige claro */
  --card: #ffffff;                 /* Tarjetas */
  --card-hover: #fdfbf8;          /* Tarjeta hover */

  /* ── Textos ─────────────────────────────── */
  --foreground: #2c2420;           /* Texto principal — café muy oscuro */
  --foreground-secondary: #6b5e54; /* Texto secundario — café medio */
  --muted: #9c8e82;               /* Texto sutil — café claro */
  --placeholder: #bfb3a8;         /* Placeholders */

  /* ── Acentos principales ────────────────── */
  --primary: #8b6f5c;             /* Café pastel principal — botones, links activos */
  --primary-hover: #7a5f4d;       /* Hover del primary */
  --primary-light: #e8ddd4;       /* Fondo suave del primary — badges, highlights */
  --primary-foreground: #ffffff;  /* Texto sobre primary */

  /* ── Acentos secundarios ────────────────── */
  --accent: #c4a882;              /* Dorado café — detalles, iconos activos */
  --accent-light: #f0e6d8;        /* Fondo del accent */

  /* ── Bordes y separadores ───────────────── */
  --border: #e8e0d6;              /* Bordes principales */
  --border-light: #f0ebe4;        /* Bordes sutiles */
  --ring: #8b6f5c33;              /* Focus ring (primary con opacidad) */

  /* ── Estados ────────────────────────────── */
  --success: #7c9a6e;             /* Verde oliva suave */
  --success-light: #e8f0e2;
  --warning: #c49a5c;             /* Ámbar café */
  --warning-light: #f5eddf;
  --destructive: #b8705a;         /* Terracota suave */
  --destructive-light: #f5e0d8;
  --info: #6e8a9a;                /* Azul grisáceo */
  --info-light: #e2ecf0;

  /* ── Sidebar ────────────────────────────── */
  --sidebar-bg: #3d2e24;          /* Café oscuro */
  --sidebar-text: #f0ebe4;        /* Texto claro */
  --sidebar-text-muted: #a89888;  /* Texto secundario sidebar */
  --sidebar-active: #8b6f5c;      /* Item activo */
  --sidebar-hover: #4a3830;       /* Item hover */

  /* ── Tipografía ─────────────────────────── */
  --font-sans: 'DM Sans', system-ui, sans-serif;
  --font-display: 'Fraunces', Georgia, serif;

  /* ── Espaciado y bordes ─────────────────── */
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  /* ── Sombras ────────────────────────────── */
  --shadow-sm: 0 1px 3px rgba(44, 36, 32, 0.04);
  --shadow: 0 2px 8px rgba(44, 36, 32, 0.06);
  --shadow-md: 0 4px 16px rgba(44, 36, 32, 0.08);
  --shadow-lg: 0 8px 32px rgba(44, 36, 32, 0.1);
}
```

### Tipografías (importar en layout.tsx)

```typescript
// Usar Google Fonts
import { DM_Sans } from 'next/font/google';
import localFont from 'next/font/local';

// DM Sans — texto general (limpia, moderna, legible)
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
});

// Fraunces — títulos y display (serif elegante con personalidad)
// Importar desde Google Fonts o local
```

### Reglas de diseño

1. **Tarjetas:** Background blanco (`--card`), borde `--border`, border-radius `--radius`, sombra `--shadow-sm`. Al hover: sombra `--shadow`.
2. **Botones primarios:** Background `--primary`, texto blanco, border-radius `--radius`, hover `--primary-hover`. Sin bordes.
3. **Botones secundarios:** Background transparente, borde `--border`, texto `--foreground`. Hover: background `--background-secondary`.
4. **Inputs:** Background `--background`, borde `--border`, border-radius `--radius-sm`. Focus: ring `--primary` con opacidad.
5. **Sidebar:** Background `--sidebar-bg` (café oscuro), texto claro. Item activo: background `--sidebar-active` con borde izquierdo de 3px.
6. **Iconos:** Usar `lucide-react`. Color `--muted` por defecto, `--primary` cuando activo.
7. **Espaciado:** Padding de pages: `p-6`. Gaps entre cards: `gap-4` o `gap-6`. Nunca menos de `gap-3`.
8. **Tipografía:** Títulos de página en `--font-display` (Fraunces). Todo lo demás en `--font-sans` (DM Sans).
9. **Sin emojis en la UI**, usar iconos de lucide-react en su lugar.
10. **Transiciones:** Usar `transition-all duration-200` en elementos interactivos.

---

## 3. Estructura de Archivos Completa

```
src/
├── app/
│   ├── layout.tsx                    # Layout raíz con fuentes y providers
│   ├── page.tsx                      # Redirect a /dashboard
│   ├── globals.css                   # Variables CSS + estilos base
│   │
│   ├── dashboard/
│   │   ├── layout.tsx                # Shell con sidebar + header
│   │   ├── page.tsx                  # Dashboard principal (resumen)
│   │   │
│   │   ├── books/
│   │   │   ├── page.tsx              # Lista de libros subidos
│   │   │   ├── actions.ts            # Server actions: upload, delete, update
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Visor de PDF + búsqueda interna
│   │   │
│   │   ├── search/
│   │   │   └── page.tsx              # Buscador global en todos los PDFs
│   │   │
│   │   ├── calendar/
│   │   │   ├── page.tsx              # Calendario visual
│   │   │   └── actions.ts            # CRUD eventos + recordatorios
│   │   │
│   │   ├── notes/
│   │   │   ├── page.tsx              # Lista y editor de notas
│   │   │   └── actions.ts            # CRUD notas + tags
│   │   │
│   │   └── settings/
│   │       ├── page.tsx              # Config Telegram
│   │       └── actions.ts            # Vincular/desvincular Telegram
│   │
│   └── api/
│       ├── books/
│       │   ├── upload/route.ts       # Upload + compresión + extracción
│       │   └── search/route.ts       # Full-text search
│       │
│       ├── ai/
│       │   └── explain/route.ts      # Explicación con Gemini
│       │
│       ├── telegram/
│       │   └── webhook/route.ts      # Webhook del bot
│       │
│       └── cron/
│           └── reminders/route.ts    # Disparar recordatorios
│
├── components/
│   ├── ui/                           # Componentes base reutilizables
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── dropdown.tsx
│   │   ├── toast.tsx
│   │   └── loading.tsx
│   │
│   ├── layout/
│   │   ├── sidebar.tsx               # Sidebar de navegación
│   │   ├── header.tsx                # Header mobile
│   │   └── shell.tsx                 # Shell (sidebar + content)
│   │
│   ├── books/
│   │   ├── book-list.tsx             # Grid de libros
│   │   ├── book-card.tsx             # Card individual de libro
│   │   ├── book-upload.tsx           # Modal/zona de upload
│   │   ├── pdf-viewer.tsx            # Visor de PDF con react-pdf
│   │   └── search-results.tsx        # Resultados de búsqueda
│   │
│   ├── search/
│   │   ├── search-bar.tsx            # Barra de búsqueda global
│   │   ├── search-result-card.tsx    # Card de resultado
│   │   └── ai-explanation.tsx        # Panel de explicación con IA
│   │
│   ├── calendar/
│   │   ├── calendar-view.tsx         # Calendario con react-big-calendar
│   │   ├── event-form.tsx            # Formulario crear/editar evento
│   │   └── reminder-config.tsx       # Configurar recordatorios del evento
│   │
│   └── notes/
│       ├── note-list.tsx             # Lista de notas
│       ├── note-card.tsx             # Card de nota
│       └── note-editor.tsx           # Editor de nota
│
├── hooks/
│   ├── use-media-query.ts            # Detectar mobile/desktop
│   ├── use-debounce.ts               # Debounce para búsqueda
│   └── use-sidebar.ts                # Estado del sidebar
│
└── lib/
    ├── db.ts                         # Cliente Prisma
    ├── pdf-processor.ts              # Extracción de texto de PDFs
    ├── pdf-compressor.ts             # Compresión con Ghostscript
    ├── gemini.ts                     # Cliente para Gemini API
    ├── telegram-bot.ts               # Config del bot Telegram
    ├── reminder-service.ts           # Lógica de envío de recordatorios
    │
    ├── queries/
    │   ├── books.ts                  # Queries de libros
    │   ├── fragments.ts              # Full-text search queries
    │   ├── calendar.ts               # Queries de eventos
    │   ├── notes.ts                  # Queries de notas
    │   └── reminders.ts              # Queries de recordatorios pendientes
    │
    └── types/
        └── index.ts                  # Tipos TypeScript compartidos
```

---

## 4. Schema de Prisma (Ya aplicado)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Book {
  id               String     @id @default(cuid())
  title            String
  originalName     String
  fileUrl          String
  fileSize         Int
  originalSize     Int?
  totalPages       Int        @default(0)
  status           BookStatus @default(PROCESSING)
  subject          String?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  fragments BookFragment[]
  tags      BookTag[]
  notes     Note[]
}

enum BookStatus {
  PROCESSING
  READY
  ERROR
}

model BookFragment {
  id         String @id @default(cuid())
  bookId     String
  pageNumber Int
  position   Int
  content    String

  book Book @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([bookId])
  @@index([bookId, pageNumber])
}

model BookTag {
  id     String @id @default(cuid())
  bookId String
  name   String

  book Book @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@unique([bookId, name])
  @@index([name])
}

model CalendarEvent {
  id          String    @id @default(cuid())
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime?
  allDay      Boolean   @default(false)
  eventType   EventType @default(OTHER)
  color       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  reminders Reminder[]
}

enum EventType {
  EXAM
  ASSIGNMENT
  PRESENTATION
  CLASS
  MEETING
  DEADLINE
  OTHER
}

model Reminder {
  id                  String       @id @default(cuid())
  eventId             String
  type                ReminderType
  customMinutesBefore Int?
  sentAt              DateTime?
  createdAt           DateTime     @default(now())

  event CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@index([sentAt])
}

enum ReminderType {
  AT_TIME
  MINUTES_15
  MINUTES_30
  HOUR_1
  HOUR_2
  DAY_1
  DAY_2
  DAY_3
  WEEK_1
  CUSTOM
}

model Note {
  id        String   @id @default(cuid())
  bookId    String?
  title     String
  content   String
  isPinned  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  book Book? @relation(fields: [bookId], references: [id], onDelete: SetNull)
  tags NoteTag[]

  @@index([isPinned])
  @@index([bookId])
}

model NoteTag {
  id     String @id @default(cuid())
  noteId String
  name   String

  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@unique([noteId, name])
  @@index([name])
}

model TelegramConfig {
  id       String   @id @default(cuid())
  chatId   String   @unique
  username String?
  isActive Boolean  @default(true)
  linkedAt DateTime @default(now())
}
```

---

## 5. Migración SQL para Full-Text Search

**IMPORTANTE:** Ejecutar después de la migración de Prisma. Crear archivo `prisma/migrations/manual/full-text-search.sql`:

```sql
-- Full-Text Search para BookFragment
ALTER TABLE "BookFragment"
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION update_fragment_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('pg_catalog.spanish', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fragment_search_update ON "BookFragment";
CREATE TRIGGER fragment_search_update
  BEFORE INSERT OR UPDATE OF content ON "BookFragment"
  FOR EACH ROW
  EXECUTE FUNCTION update_fragment_search_vector();

CREATE INDEX IF NOT EXISTS fragment_search_idx
  ON "BookFragment" USING GIN(search_vector);

UPDATE "BookFragment"
SET search_vector = to_tsvector('pg_catalog.spanish', COALESCE(content, ''))
WHERE search_vector IS NULL;
```

Ejecutar con:

```bash
# Windows (local)
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d myorbita -f prisma/migrations/manual/full-text-search.sql

# Linux (VPS, producción)
psql -U postgres -d myorbita -f prisma/migrations/manual/full-text-search.sql
```

---

## 6. Configuración de Archivos Base

### lib/db.ts — Cliente Prisma

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString });
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### lib/pdf-compressor.ts — Compresión con Ghostscript

```typescript
import { execFile } from 'child_process';
import { stat } from 'fs/promises';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

// En Windows: gswin64c, en Linux: gs
const GS_COMMAND = process.platform === 'win32' ? 'gswin64c' : 'gs';

export async function compressPdf(inputPath: string, outputPath: string): Promise<{
  success: boolean;
  originalSize: number;
  compressedSize: number;
}> {
  const originalStat = await stat(inputPath);
  const originalSize = originalStat.size;

  try {
    await execFileAsync(GS_COMMAND, [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook',
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      '-dColorImageResolution=150',
      '-dGrayImageResolution=150',
      '-dMonoImageResolution=300',
      `-sOutputFile=${outputPath}`,
      inputPath,
    ]);

    const compressedStat = await stat(outputPath);
    const compressedSize = compressedStat.size;

    // Si el comprimido es más grande que el original, no tiene sentido
    if (compressedSize >= originalSize) {
      return { success: false, originalSize, compressedSize: originalSize };
    }

    return { success: true, originalSize, compressedSize };
  } catch (error) {
    console.error('[Compressor] Error:', error);
    return { success: false, originalSize, compressedSize: originalSize };
  }
}
```

### lib/pdf-processor.ts — Extracción de texto

```typescript
import pdf from 'pdf-parse';
import { readFile } from 'fs/promises';

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

  const data = await pdf(buffer);

  // Dividir por páginas usando form feeds o doble salto de línea
  const pages = data.text.split(/\f/);

  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i];
    const paragraphs = pageText
      .split(/\n\s*\n/)
      .map(p => p.replace(/\s+/g, ' ').trim())
      .filter(p => p.length >= 20);

    paragraphs.forEach((text, index) => {
      fragments.push({
        pageNumber: i + 1,
        position: index + 1,
        content: text,
      });
    });
  }

  return {
    totalPages: data.numpages,
    fragments,
  };
}
```

### lib/gemini.ts — Cliente Gemini API (gratis)

```typescript
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface BookContext {
  bookTitle: string;
  pageNumber: number;
  content: string;
}

export async function explainWithAI(
  question: string,
  contexts: BookContext[]
): Promise<{ explanation: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { explanation: '', error: 'API Key de Gemini no configurada' };

  const contextText = contexts
    .map((c, i) => `[Fuente ${i + 1}: "${c.bookTitle}", Página ${c.pageNumber}]\n${c.content}`)
    .join('\n\n---\n\n');

  const prompt = `Eres un asistente de estudio universitario. Explica conceptos basándote ÚNICAMENTE en los extractos proporcionados.

REGLAS:
1. Responde SOLO con información de los extractos.
2. Si no hay información relevante, dilo: "No encontré información sobre esto en tus libros."
3. Cita siempre la fuente: nombre del libro y página.
4. Explica de forma clara y didáctica.
5. Combina información de distintos libros si es relevante.
6. Responde en español.

EXTRACTOS:
${contextText}

PREGUNTA: ${question}`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      console.error('[Gemini] Error:', response.status);
      return { explanation: '', error: 'Error al consultar la IA' };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { explanation: text };
  } catch (err) {
    console.error('[Gemini] Error:', err);
    return { explanation: '', error: 'No se pudo conectar con el servicio de IA' };
  }
}
```

### lib/telegram-bot.ts — Bot de Telegram

```typescript
import { Telegraf } from 'telegraf';
import { prisma } from '@/lib/db';

const token = process.env.TELEGRAM_BOT_TOKEN;
export const bot = token ? new Telegraf(token) : null;

if (bot) {
  bot.command('start', async (ctx) => {
    const linkCode = ctx.message.text.split(' ')[1];
    const chatId = String(ctx.chat.id);
    const username = ctx.from.username ?? null;

    if (!linkCode) {
      return ctx.reply(
        '👋 ¡Hola! Soy el bot de MyOrbita.\n\n' +
        'Para vincular tu cuenta, ve a MyOrbita → Configuración → Telegram.'
      );
    }

    // Guardar o actualizar config
    await prisma.telegramConfig.upsert({
      where: { chatId },
      update: { username, isActive: true },
      create: { chatId, username, isActive: true },
    });

    ctx.reply('✅ ¡Cuenta vinculada! Recibirás recordatorios aquí.');
  });

  bot.command('silenciar', async (ctx) => {
    const chatId = String(ctx.chat.id);
    await prisma.telegramConfig.updateMany({
      where: { chatId },
      data: { isActive: false },
    });
    ctx.reply('🔇 Recordatorios desactivados. Usa /activar para reactivar.');
  });

  bot.command('activar', async (ctx) => {
    const chatId = String(ctx.chat.id);
    await prisma.telegramConfig.updateMany({
      where: { chatId },
      data: { isActive: true },
    });
    ctx.reply('🔔 Recordatorios activados.');
  });
}
```

### lib/reminder-service.ts — Envío de recordatorios

```typescript
import { prisma } from '@/lib/db';
import { bot } from '@/lib/telegram-bot';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  EXAM: '📝',
  ASSIGNMENT: '📋',
  PRESENTATION: '🎤',
  CLASS: '📚',
  DEADLINE: '⏰',
  MEETING: '🤝',
  OTHER: '📌',
};

export async function processReminders() {
  if (!bot) return { processed: 0, sent: 0 };

  const now = new Date();
  const pendingReminders = await prisma.reminder.findMany({
    where: { sentAt: null },
    include: { event: true },
  });

  const telegramConfig = await prisma.telegramConfig.findFirst({
    where: { isActive: true },
  });

  if (!telegramConfig) return { processed: pendingReminders.length, sent: 0 };

  let sent = 0;
  for (const reminder of pendingReminders) {
    const minutesBefore = reminder.type === 'CUSTOM'
      ? (reminder.customMinutesBefore ?? 0)
      : (REMINDER_MINUTES[reminder.type] ?? 0);

    const sendAt = new Date(reminder.event.startDate.getTime() - minutesBefore * 60 * 1000);

    if (now >= sendAt) {
      const icon = EVENT_ICONS[reminder.event.eventType] ?? '📌';
      const eventDate = format(reminder.event.startDate, "EEEE d 'de' MMMM, HH:mm", { locale: es });

      const message =
        `${icon} *${reminder.event.title}*\n\n` +
        `📅 ${eventDate}\n` +
        (reminder.event.description ? `📝 ${reminder.event.description}\n` : '') +
        (minutesBefore > 0 ? `\n⏱ Faltan ${formatTime(minutesBefore)}` : '\n⏱ ¡Es ahora!');

      try {
        await bot.telegram.sendMessage(telegramConfig.chatId, message, { parse_mode: 'Markdown' });
        sent++;
      } catch (err) {
        console.error('[Reminder] Error:', err);
      }

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sentAt: now },
      });
    }
  }

  return { processed: pendingReminders.length, sent };
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} horas`;
  if (minutes < 10080) return `${Math.round(minutes / 1440)} días`;
  return `${Math.round(minutes / 10080)} semanas`;
}
```

---

## 7. API Routes

### api/books/upload/route.ts — Upload + compresión + extracción

```typescript
import { NextResponse } from 'next/server';
import { writeFile, mkdir, rename, unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { compressPdf } from '@/lib/pdf-compressor';
import { extractPdfFragments } from '@/lib/pdf-processor';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_SIZE = (parseInt(process.env.MAX_PDF_SIZE_MB || '50') || 50) * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const title = formData.get('title')?.toString()?.trim();
  const subject = formData.get('subject')?.toString()?.trim() || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se envió un archivo' }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: `El archivo supera el límite de ${process.env.MAX_PDF_SIZE_MB || 50} MB` }, { status: 400 });
  }

  const bookTitle = title || file.name.replace(/\.pdf$/i, '');
  const timestamp = Date.now();
  const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const booksDir = path.join(UPLOAD_DIR, 'books');

  await mkdir(booksDir, { recursive: true });

  // Guardar archivo original temporal
  const tempPath = path.join(booksDir, `temp-${safeName}`);
  const finalPath = path.join(booksDir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(tempPath, buffer);

  // Comprimir con Ghostscript
  const compression = await compressPdf(tempPath, finalPath);

  if (compression.success) {
    // Compresión exitosa: borrar el temporal, mantener el comprimido
    await unlink(tempPath);
  } else {
    // No se pudo comprimir o no redujo tamaño: renombrar el original
    await rename(tempPath, finalPath);
  }

  // Crear registro en DB
  const book = await prisma.book.create({
    data: {
      title: bookTitle,
      originalName: file.name,
      fileUrl: `/uploads/books/${safeName}`,
      fileSize: compression.success ? compression.compressedSize : compression.originalSize,
      originalSize: compression.originalSize,
      subject,
      status: 'PROCESSING',
    },
  });

  // Extraer texto en background (no bloquear respuesta)
  extractAndIndex(book.id, finalPath).catch(err => {
    console.error(`[Upload] Error procesando ${book.id}:`, err);
  });

  return NextResponse.json({
    book: {
      id: book.id,
      title: book.title,
      status: book.status,
      fileSize: book.fileSize,
      originalSize: book.originalSize,
      compressionRatio: compression.success
        ? Math.round((1 - compression.compressedSize / compression.originalSize) * 100)
        : 0,
    },
  });
}

async function extractAndIndex(bookId: string, filePath: string) {
  try {
    const { totalPages, fragments } = await extractPdfFragments(filePath);

    // Insertar fragmentos en batches de 100
    for (let i = 0; i < fragments.length; i += 100) {
      const batch = fragments.slice(i, i + 100);
      await prisma.bookFragment.createMany({
        data: batch.map(f => ({
          bookId,
          pageNumber: f.pageNumber,
          position: f.position,
          content: f.content,
        })),
      });
    }

    await prisma.book.update({
      where: { id: bookId },
      data: { status: 'READY', totalPages },
    });
  } catch (error) {
    console.error(`[Extract] Error:`, error);
    await prisma.book.update({
      where: { id: bookId },
      data: { status: 'ERROR' },
    });
  }
}
```

### api/books/search/route.ts — Búsqueda full-text

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const bookId = searchParams.get('bookId') || null;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Búsqueda muy corta' }, { status: 400 });
  }

  const bookCondition = bookId ? `AND b.id = $3` : '';
  const params: (string | number)[] = [query, limit];
  if (bookId) params.push(bookId);

  const results = await prisma.$queryRawUnsafe(`
    SELECT
      bf.id,
      bf."pageNumber",
      bf.position,
      bf.content,
      b.id AS "bookId",
      b.title AS "bookTitle",
      b."fileUrl",
      ts_rank(bf.search_vector, query) AS relevance,
      ts_headline('spanish', bf.content, query,
        'StartSel=<mark>, StopSel=</mark>, MaxWords=60, MinWords=20'
      ) AS highlighted
    FROM "BookFragment" bf
    JOIN "Book" b ON b.id = bf."bookId"
    CROSS JOIN plainto_tsquery('spanish', $1) query
    WHERE bf.search_vector @@ query
      AND b.status = 'READY'
      ${bookCondition}
    ORDER BY relevance DESC
    LIMIT $2
  `, ...params);

  return NextResponse.json({ results, query });
}
```

### api/ai/explain/route.ts — Explicación con Gemini

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { explainWithAI } from '@/lib/gemini';

export async function POST(request: Request) {
  const { question, bookId } = await request.json();

  if (!question?.trim()) {
    return NextResponse.json({ error: 'Pregunta vacía' }, { status: 400 });
  }

  const bookCondition = bookId ? `AND b.id = '${bookId}'` : '';

  const fragments = await prisma.$queryRawUnsafe(`
    SELECT bf.content, bf."pageNumber", b.title AS "bookTitle", b.id AS "bookId"
    FROM "BookFragment" bf
    JOIN "Book" b ON b.id = bf."bookId"
    CROSS JOIN plainto_tsquery('spanish', $1) query
    WHERE bf.search_vector @@ query AND b.status = 'READY' ${bookCondition}
    ORDER BY ts_rank(bf.search_vector, query) DESC
    LIMIT 10
  `, question) as Array<{
    content: string; pageNumber: number; bookTitle: string; bookId: string;
  }>;

  if (fragments.length === 0) {
    return NextResponse.json({
      explanation: 'No encontré información relevante en tus libros. Intenta con otros términos.',
      sources: [],
    });
  }

  const { explanation, error } = await explainWithAI(question, fragments);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const sources = fragments.slice(0, 5).map(f => ({
    bookId: f.bookId,
    bookTitle: f.bookTitle,
    pageNumber: f.pageNumber,
    preview: f.content.slice(0, 150) + '...',
  }));

  return NextResponse.json({ explanation, sources });
}
```

### api/telegram/webhook/route.ts — Webhook del bot

```typescript
import { NextResponse } from 'next/server';
import { bot } from '@/lib/telegram-bot';

export async function POST(request: Request) {
  if (!bot) {
    return NextResponse.json({ error: 'Bot no configurado' }, { status: 500 });
  }
  try {
    const body = await request.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Telegram Webhook]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
```

### api/cron/reminders/route.ts — Cron de recordatorios

```typescript
import { NextResponse } from 'next/server';
import { processReminders } from '@/lib/reminder-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const result = await processReminders();
  return NextResponse.json(result);
}
```

---

## 8. Páginas y Navegación

### Sidebar — Navegación principal

```
📊 Dashboard          /dashboard
📚 Biblioteca         /dashboard/books
🔍 Buscar             /dashboard/search
📅 Calendario         /dashboard/calendar
📝 Notas              /dashboard/notes
⚙️ Configuración      /dashboard/settings
```

Usar iconos de lucide-react: `LayoutDashboard`, `BookOpen`, `Search`, `Calendar`, `StickyNote`, `Settings`.

### Dashboard (página principal)

Muestra un resumen con tarjetas:
- Total de libros subidos y páginas indexadas
- Próximos eventos del calendario (3 más cercanos)
- Notas fijadas (pinnadas)
- Búsqueda rápida (input que redirige a /dashboard/search)
- Estado de Telegram (vinculado o no)

### Biblioteca (/dashboard/books)

- Grid de cards con los libros subidos
- Cada card muestra: título, materia (badge), páginas, tamaño (original → comprimido), estado
- Botón "Subir PDF" abre modal con drag & drop
- Click en un libro → /dashboard/books/[id] con visor PDF

### Visor de libro (/dashboard/books/[id])

- Visor PDF con react-pdf (renderiza páginas)
- Barra lateral con búsqueda interna del libro
- Navegación por páginas
- Botón "Preguntar con IA" abre panel de explicación

### Buscador global (/dashboard/search)

- Input de búsqueda grande en el centro
- Resultados con: título del libro, página, texto con highlight (<mark>)
- Cada resultado tiene botón "Ver en PDF" y "Explicar con IA"
- Panel de explicación con IA se abre debajo o al costado
- La explicación muestra fuentes clicables que llevan al PDF

### Calendario (/dashboard/calendar)

- Vista mensual con react-big-calendar
- Eventos con colores por tipo (EXAM rojo, ASSIGNMENT azul, etc.)
- Click en día → formulario para crear evento
- Click en evento → ver/editar con config de recordatorios
- Formulario de recordatorios: checkboxes para elegir cuándo (15 min antes, 1 hora, 1 día, etc.)

### Notas (/dashboard/notes)

- Lista de notas con búsqueda
- Editor simple (título + contenido textarea)
- Tags editables
- Opción de vincular a un libro (select)
- Notas pinneadas aparecen primero

### Configuración (/dashboard/settings)

- Sección Telegram: botón "Vincular Telegram" genera link t.me/myorbita_cloud_bot?start=CODIGO
- Estado de conexión (vinculado/desvinculado)
- Toggle para activar/desactivar recordatorios
- Info del almacenamiento usado (total de PDFs)

---

## 9. Orden de Implementación Recomendado

### Fase 1: Base
1. `globals.css` con las variables de color
2. `layout.tsx` con fuentes (DM Sans + Fraunces)
3. `page.tsx` redirect a /dashboard
4. Componentes UI base: button, input, card, modal, badge
5. Shell (sidebar + header + content area)
6. Dashboard page con placeholder cards

### Fase 2: Biblioteca de PDFs
7. `lib/db.ts` — Cliente Prisma
8. `lib/pdf-compressor.ts` — Compresión Ghostscript
9. `lib/pdf-processor.ts` — Extracción de texto
10. `api/books/upload/route.ts` — Upload API
11. Componentes: book-upload, book-list, book-card
12. Page: /dashboard/books

### Fase 3: Full-Text Search
13. Ejecutar migración SQL de full-text search
14. `api/books/search/route.ts` — Search API
15. Componentes: search-bar, search-results, search-result-card
16. Page: /dashboard/search
17. Visor PDF: /dashboard/books/[id]

### Fase 4: IA con Gemini
18. `lib/gemini.ts` — Cliente Gemini
19. `api/ai/explain/route.ts` — Explain API
20. Componente: ai-explanation
21. Integrar en search page y book viewer

### Fase 5: Calendario
22. `lib/queries/calendar.ts` — Queries
23. Server actions para CRUD eventos
24. Componentes: calendar-view, event-form, reminder-config
25. Page: /dashboard/calendar

### Fase 6: Telegram + Recordatorios
26. `lib/telegram-bot.ts` — Config bot
27. `lib/reminder-service.ts` — Servicio de envío
28. `api/telegram/webhook/route.ts`
29. `api/cron/reminders/route.ts`
30. Sección en settings para vincular Telegram

### Fase 7: Notas
31. Server actions CRUD notas
32. Componentes: note-list, note-card, note-editor
33. Page: /dashboard/notes

### Fase 8: Polish
34. Dashboard con datos reales
35. Responsive mobile
36. Loading states y skeletons
37. Toast notifications
38. Empty states bonitos

---

## 10. Configuración de next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    // react-pdf necesita esto para no fallar en SSR
    config.resolve.alias.canvas = false;
    return config;
  },
  // Servir archivos estáticos desde /uploads
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/files/:path*', // O servir directamente
      },
    ];
  },
};

export default nextConfig;
```

---

## 11. Deployment (VPS — después de desarrollo local)

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name myorbita.cloud;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/books/ {
        alias /var/myorbita/uploads/books/;
        expires 30d;
    }
}
```

### PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'myorbita',
    cwd: '/var/www/myorbita',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    env: { NODE_ENV: 'production', PORT: 3001 },
    max_memory_restart: '500M',
  }],
};
```

### Cron para recordatorios

```bash
* * * * * curl -s "http://localhost:3001/api/cron/reminders?secret=TU_CRON_SECRET" > /dev/null 2>&1
```

### Webhook de Telegram (ejecutar una vez)

```bash
curl -X POST "https://api.telegram.org/botTU_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://myorbita.cloud/api/telegram/webhook"}'
```