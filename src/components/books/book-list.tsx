"use client";

import { useState } from "react";
import { BookCard } from "./book-card";
import { BookDeleteModal } from "./book-delete-modal";
import { BookOpen } from "lucide-react";
import type { BookForList } from "@/lib/types";

interface BookListProps {
  books: BookForList[];
}

export function BookList({ books }: BookListProps) {
  const [bookToDelete, setBookToDelete] = useState<BookForList | null>(null);

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] rounded-3xl border-2 border-dashed border-border/60 bg-gradient-to-b from-background-secondary/30 to-background-secondary/10 p-12 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-6 ring-8 ring-primary/5">
          <BookOpen className="size-10 stroke-[1.5]" />
        </div>
        <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground mb-2">
          Comienza tu biblioteca
        </h3>
        <p className="text-base text-muted-foreground/80 max-w-sm mb-8">
          Aún no tienes documentos guardados. Sube tu primer PDF para empezar a organizar tus lecturas.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onDeleteClick={setBookToDelete}
          />
        ))}
      </div>
      <BookDeleteModal
        book={bookToDelete}
        open={!!bookToDelete}
        onOpenChange={(open) => !open && setBookToDelete(null)}
      />
    </>
  );
}
