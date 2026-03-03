"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Worker en CDN para evitar problemas de resolución en Next.js
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  title: string;
  totalPages?: number;
}

export function PdfViewerModal({
  open,
  onOpenChange,
  fileUrl,
  title,
  totalPages: initialTotalPages,
}: PdfViewerModalProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages ?? 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const hasMultiplePages = totalPages > 1;
  const baseWidth = 800;
  const minScale = 0.5;
  const maxScale = 2.5;
  const scaleStep = 0.25;

  useEffect(() => {
    if (!open) return;
    setPageNumber(1);
    setError(null);
    if (initialTotalPages) setTotalPages(initialTotalPages);
    else setTotalPages(0);
  }, [open, fileUrl, initialTotalPages]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setTotalPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError() {
    setLoading(false);
    setError("No se pudo cargar el PDF.");
  }

  function goPrev() {
    setPageNumber((p) => Math.max(1, p - 1));
  }

  function goNext() {
    setPageNumber((p) => Math.min(totalPages, p + 1));
  }

  function zoomIn() {
    setScale((s) => Math.min(maxScale, s + scaleStep));
  }

  function zoomOut() {
    setScale((s) => Math.max(minScale, s - scaleStep));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-4xl overflow-hidden flex flex-col p-0 sm:max-w-4xl"
        showCloseButton={true}
      >
        <SheetHeader className="shrink-0 border-b px-4 py-3">
          <SheetTitle className="text-left truncate pr-8">{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto flex flex-col items-center bg-muted/30 p-4">
          {error && (
            <p className="text-destructive text-sm py-8">{error}</p>
          )}
          {!error && (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                loading ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                    Cargando…
                  </div>
                ) : null
              }
              noData={
                <div className="py-16 text-muted-foreground">
                  No hay datos en el PDF.
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={baseWidth * scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          )}
        </div>
        {!error && (
          <div className="shrink-0 flex flex-wrap items-center justify-center gap-3 border-t bg-background px-4 py-3">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={zoomOut}
                disabled={scale <= minScale}
                aria-label="Alejar"
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="min-w-[4rem] text-center text-sm text-muted-foreground tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={zoomIn}
                disabled={scale >= maxScale}
                aria-label="Acercar"
              >
                <ZoomIn className="size-4" />
              </Button>
            </div>
            {hasMultiplePages && (
              <>
                <div className="h-6 w-px bg-border" aria-hidden />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={goPrev}
                  disabled={pageNumber <= 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[8rem] text-center text-sm text-muted-foreground">
                  Página {pageNumber} de {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={goNext}
                  disabled={pageNumber >= totalPages}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
