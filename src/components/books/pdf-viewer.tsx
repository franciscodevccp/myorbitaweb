"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, Expand, Shrink } from "lucide-react";
import { Button } from "@/components/ui/button";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Worker en CDN para evitar problemas de resolución en Next.js
if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export interface PdfViewerProps {
    fileUrl: string;
    totalPages?: number;
}

export function PdfViewer({
    fileUrl,
    totalPages: initialTotalPages,
}: PdfViewerProps) {
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(initialTotalPages ?? 0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [containerWidth, setContainerWidth] = useState<number>(800);
    const [scale, setScale] = useState(1.0);

    const containerRef = useRef<HTMLDivElement>(null);

    const hasMultiplePages = totalPages > 1;

    useEffect(() => {
        setPageNumber(1);
        setError(null);
        if (initialTotalPages) setTotalPages(initialTotalPages);
        else setTotalPages(0);
        setLoading(true);
        setScale(1.0); // Reset scale on new file
    }, [fileUrl, initialTotalPages]);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                // Remove padding/margins from width calculation
                const width = containerRef.current.clientWidth;
                // Leave a tiny margin to ensure no scrollbar appears due to floating point rounding
                setContainerWidth(Math.floor(width) - 2);
            }
        };

        // Initial measurement
        const timeoutId = setTimeout(updateWidth, 100);

        // Resize listener
        window.addEventListener('resize', updateWidth);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateWidth);
        };
    }, [isFullscreen]); // Re-calculate when fullscreen changes

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Error attempting to toggle fullscreen:', err);
        }
    };

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setTotalPages(numPages);
        setLoading(false);
        setError(null);

        // Ensure width is correct after load
        if (containerRef.current) {
            setContainerWidth(Math.floor(containerRef.current.clientWidth) - 2);
        }
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
        setScale((s) => Math.min(3.0, s + 0.25));
    }

    function zoomOut() {
        setScale((s) => Math.max(0.5, s - 0.25));
    }

    return (
        <div
            ref={containerRef}
            className={`flex flex-col bg-card border rounded-xl shadow-sm transition-all duration-200 ${isFullscreen ? 'h-screen w-screen border-none rounded-none z-50 fixed inset-0 bg-background/95 backdrop-blur-sm' : 'overflow-hidden'}`}
        >
            {/* Controls Container - Top */}
            <div className="flex flex-wrap items-center justify-between border-b px-4 py-3 bg-muted/50 gap-4 shrink-0">
                <div className="flex items-center gap-2">
                    {hasMultiplePages && !error && (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={goPrev}
                                disabled={pageNumber <= 1}
                                aria-label="Página anterior"
                                className="h-9 w-9"
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="text-sm font-medium text-foreground min-w-[5rem] text-center">
                                {pageNumber} / {totalPages}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={goNext}
                                disabled={pageNumber >= totalPages}
                                aria-label="Página siguiente"
                                className="h-9 w-9"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </>
                    )}
                </div>

                <div className="flex flex-1 justify-center items-center gap-2 px-4">
                    {!error && (
                        <div className="flex items-center gap-1 bg-background rounded-md border shadow-sm p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={zoomOut}
                                disabled={scale <= 0.5}
                                aria-label="Alejar"
                                className="h-8 w-8 hover:bg-muted"
                            >
                                <ZoomOut className="size-4" />
                            </Button>
                            <span className="text-xs font-medium w-12 text-center text-muted-foreground select-none">
                                {Math.round(scale * 100)}%
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={zoomIn}
                                disabled={scale >= 3.0}
                                aria-label="Acercar"
                                className="h-8 w-8 hover:bg-muted"
                            >
                                <ZoomIn className="size-4" />
                            </Button>
                        </div>
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="gap-2 h-9"
                    aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                >
                    {isFullscreen ? (
                        <>
                            <Shrink className="size-4" />
                            <span className="hidden sm:inline">Normal</span>
                        </>
                    ) : (
                        <>
                            <Expand className="size-4" />
                            <span className="hidden sm:inline">Completa</span>
                        </>
                    )}
                </Button>
            </div>

            {/* PDF View Container */}
            <div className={`flex-1 overflow-auto bg-muted/20 flex flex-col items-center custom-scrollbar ${isFullscreen ? 'p-2 sm:p-4' : 'min-h-[600px] p-2 sm:p-4'}`}>
                {error && (
                    <div className="flex flex-col items-center justify-center text-destructive py-10 my-auto">
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {!error && (
                    <div className={`flex justify-center transition-transform duration-200 ease-out origin-top ${scale > 1 ? 'w-auto' : 'w-full max-w-full'}`} style={{ minHeight: 'fit-content' }}>
                        <div className="shadow-lg rounded-xl overflow-hidden bg-white ring-1 ring-border/50">
                            <Document
                                file={fileUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                className="flex justify-center"
                                loading={
                                    <div className="flex flex-col items-center justify-center min-h-[500px] min-w-[350px] text-muted-foreground gap-3">
                                        <Loader2 className="size-8 animate-spin text-primary/60" />
                                        <p className="text-sm font-medium animate-pulse">Cargando documento...</p>
                                    </div>
                                }
                                noData={
                                    <div className="py-16 px-8 text-center text-muted-foreground">
                                        No hay datos en el PDF.
                                    </div>
                                }
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    width={containerWidth}
                                    scale={scale}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    className="!bg-transparent"
                                />
                            </Document>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Container - Bottom (Optional, for redundancy on long pages) */}
            {hasMultiplePages && !error && (
                <div className="flex items-center justify-center gap-4 border-t px-4 py-3 bg-muted/50 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={goPrev}
                        disabled={pageNumber <= 1}
                        className="gap-2 h-9"
                    >
                        <ChevronLeft className="size-4" />
                        <span className="hidden sm:inline">Anterior</span>
                    </Button>
                    <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">
                        Página {pageNumber} de {totalPages}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={goNext}
                        disabled={pageNumber >= totalPages}
                        className="gap-2 h-9"
                    >
                        <span className="hidden sm:inline">Siguiente</span>
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
