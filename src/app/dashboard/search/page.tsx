import { prisma } from "@/lib/db";
import { SearchPageClient } from "./search-page-client";
import type { BookForList } from "@/lib/types";

export default async function SearchPage() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      originalName: true,
      fileUrl: true,
      fileSize: true,
      originalSize: true,
      totalPages: true,
      status: true,
      subject: true,
      createdAt: true,
    },
  });

  return (
    <div className="w-full h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 pb-6 border-b border-border/40">
        <div className="inline-flex items-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            Asistente IA
          </div>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Conversa con tus Documentos
        </h1>
        <p className="text-base text-muted-foreground max-w-xl">
          Selecciona un documento de tu biblioteca y pregúntale a Gemini cualquier concepto o resumen que necesites.
        </p>
      </div>
      <SearchPageClient initialBooks={books as BookForList[]} />
    </div>
  );
}
