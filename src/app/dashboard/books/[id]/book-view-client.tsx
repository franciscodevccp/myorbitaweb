"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const PdfViewer = dynamic(
  () => import("@/components/books/pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-xl bg-muted/10 text-muted-foreground gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-medium animate-pulse">Preparando visor de PDF...</p>
      </div>
    )
  }
);

interface BookViewClientProps {
  book: {
    id: string;
    title: string;
    fileUrl: string;
    totalPages: number;
  };
  children: React.ReactNode;
}

export function BookViewClient({ book, children }: BookViewClientProps) {
  return (
    <div className="space-y-6">
      {children}
      <div className="w-full">
        <PdfViewer
          fileUrl={book.fileUrl}
          totalPages={book.totalPages}
        />
      </div>
    </div>
  );
}
