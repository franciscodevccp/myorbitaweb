"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { BookOpen, Loader2, AlertCircle, Trash2 } from "lucide-react";
import type { BookForList } from "@/lib/types";

function StatusBadge({ status }: { status: BookForList["status"] }) {
  if (status === "READY")
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--success-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--success)]">
        Listo
      </span>
    );
  if (status === "PROCESSING")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--info-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--info)]">
        <Loader2 className="size-3 animate-spin" />
        Procesando
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--destructive-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--destructive)]">
      <AlertCircle className="size-3" />
      Error
    </span>
  );
}

interface BookCardProps {
  book: BookForList;
  onDeleteClick?: (book: BookForList) => void;
}

export function BookCard({ book, onDeleteClick }: BookCardProps) {
  return (
    <div className="relative h-full group animate-in fade-in zoom-in-95 duration-300">
      <Link href={`/dashboard/books/${book.id}`} className="block h-full">
        <Card className="h-full flex flex-col border border-border/60 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 hover:bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-start gap-4 p-5 pb-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner border border-primary/10 transition-transform duration-300 group-hover:scale-110">
              <BookOpen className="size-6" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 mt-0.5">
              <h2 className="font-bold text-foreground text-lg tracking-tight truncate group-hover:text-primary transition-colors leading-snug" title={book.title}>
                {book.title}
              </h2>
              {book.subject && (
                <div className="flex items-center gap-2 truncate" title={book.subject}>
                  <span className="shrink-0 inline-flex items-center rounded bg-secondary/60 border border-border/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm">
                    Materia
                  </span>
                  <p className="text-sm font-medium text-foreground/80 truncate">
                    {book.subject}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3 mt-auto">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <StatusBadge status={book.status} />
                <span className="text-xs font-medium text-muted-foreground/70 bg-muted/40 px-2 py-1 rounded-md">
                  {book.totalPages} págs
                </span>
              </div>

              <div className="h-px w-full bg-border/40 mt-1 mb-2" />

              <p className="text-[11px] text-muted-foreground/60 truncate flex items-center gap-1.5" title={book.originalName}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                {book.originalName}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>

      {onDeleteClick && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeleteClick(book);
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:text-destructive hover:bg-destructive/10 focus:opacity-100 focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-destructive/50 shadow-sm bg-background/80 backdrop-blur-md"
          aria-label="Eliminar libro"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
