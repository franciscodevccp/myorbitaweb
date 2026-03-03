"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, FileText } from "lucide-react";

const MAX_SIZE_MB = parseInt(process.env.NEXT_PUBLIC_MAX_PDF_SIZE_MB ?? "50", 10);

interface BookUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookUpload({ open, onOpenChange }: BookUploadProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setTitle("");
    setSubject("");
    setFile(null);
    setError(null);
  }, []);

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f?.type === "application/pdf") setFile(f);
    else if (f) setError("Solo se permiten archivos PDF.");
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (f?.type === "application/pdf") setFile(f);
    else if (f) setError("Solo se permiten archivos PDF.");
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!file) {
        setError("Selecciona un archivo PDF.");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`El archivo supera el límite de ${MAX_SIZE_MB} MB.`);
        return;
      }
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.set("file", file);
        if (title.trim()) formData.set("title", title.trim());
        if (subject.trim()) formData.set("subject", subject.trim());
        const res = await fetch("/api/books/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Error al subir.");
          return;
        }
        handleClose(false);
        router.refresh();
      } catch {
        setError("Error de conexión.");
      } finally {
        setUploading(false);
      }
    },
    [file, title, subject, handleClose, router]
  );

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col border-l-0 sm:border-l shadow-2xl p-0"
        showCloseButton={!uploading}
      >
        <div className="flex-1 overflow-auto flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
            <SheetTitle className="text-2xl font-semibold tracking-tight">Subir PDF</SheetTitle>
            <SheetDescription className="text-sm">
              Título y materia son opcionales. Tamaño máximo de {MAX_SIZE_MB} MB.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 flex-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/90 block">
                  Título (opcional)
                </label>
                <Input
                  placeholder="Ej: Apuntes Estructuras"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={uploading}
                  className="h-12 px-4 rounded-xl bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/90 block">
                  Materia (opcional)
                </label>
                <Input
                  placeholder="Ej: Estructuras"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={uploading}
                  className="h-12 px-4 rounded-xl bg-muted/50 border-transparent hover:border-border focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[240px]">
              <label className="text-sm font-medium text-foreground/90 mb-2 block">
                Archivo PDF
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                  relative flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 overflow-hidden group
                  ${dragActive
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-primary/50"
                  }
                  ${uploading ? "opacity-60 pointer-events-none" : "cursor-pointer"}
                `}
              >
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title=""
                  id="book-file"
                  disabled={uploading}
                />

                {file ? (
                  <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="size-7 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground max-w-[200px] truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <div className={`
                      size-16 rounded-full flex items-center justify-center transition-colors duration-200
                      ${dragActive ? "bg-primary text-primary-foreground" : "bg-background shadow-sm group-hover:bg-primary/5 group-hover:text-primary"}
                    `}>
                      <Upload className={`size-8 ${dragActive ? "animate-bounce" : ""}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Haz clic para subir o arrastra
                      </p>
                      <p className="text-xs mt-1">
                        Solo archivos PDF (max. {MAX_SIZE_MB}MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                {error}
              </div>
            )}

            <SheetFooter className="mt-auto pt-6 border-t gap-3 sm:gap-3 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={uploading}
                className="w-full sm:w-1/2 h-12 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={uploading || !file}
                className="w-full sm:w-1/2 h-12 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" />
                    Subiendo…
                  </>
                ) : (
                  "Subir Documento"
                )}
              </Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
