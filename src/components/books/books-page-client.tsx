"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookList } from "./book-list";
import { BookUpload } from "./book-upload";
import { Upload } from "lucide-react";
import type { BookForList } from "@/lib/types";

interface BooksPageClientProps {
  books: BookForList[];
}

export function BooksPageClient({ books }: BooksPageClientProps) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
            Tus Archivos
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Biblioteca de Documentos
          </h1>
          <p className="text-base text-muted-foreground max-w-xl">
            Sube, gestiona y lee tus libros y apuntes en formato PDF.
            Todos tus documentos están disponibles en la nube.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="shrink-0 h-11 px-6 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 group">
          <Upload className="size-4 mr-2 transition-transform group-hover:-translate-y-0.5" />
          Subir Nuevo PDF
        </Button>
      </div>

      <div className="relative min-h-[400px]">
        <BookList books={books} />
      </div>

      <BookUpload open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
