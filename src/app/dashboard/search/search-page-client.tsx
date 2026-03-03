"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { BookForList } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Search, User, BookOpen, FileText } from "lucide-react";

interface SearchPageClientProps {
  initialBooks: BookForList[];
}

type SearchResultFragment = { pageNumber: number; content: string };

type Message = {
  role: "user" | "model";
  content: string;
  searchResults?: { bookTitle: string; fragments: SearchResultFragment[] };
};

export function SearchPageClient({ initialBooks }: SearchPageClientProps) {
  const [selectedBookId, setSelectedBookId] = useState<string>("" as string);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedBookId || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: selectedBookId,
          message: userMsg.content,
          history: messages,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al comunicarse con la IA");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: data.text ?? "",
          searchResults: data.searchResults ?? undefined,
        },
      ]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: `❌ Hubo un error: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleBookChange = (bookId: string) => {
    setSelectedBookId(bookId);
    setMessages([]); // Reset chat when changing book
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById("pdf-selector-dropdown");
      const container = dropdown?.parentElement;
      if (dropdown && !dropdown.classList.contains("hidden") && container && !container.contains(e.target as Node)) {
        dropdown.classList.add("hidden");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <Card className="flex flex-col h-full overflow-hidden border-border/60 shadow-lg relative bg-card/40 backdrop-blur-sm">

        {/* Chat Header / PDF Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-border/40 bg-background-secondary/30">
          <div className="flex items-center gap-3 w-full">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
              <BookOpen className="size-5 text-primary" strokeWidth={1.5} />
            </div>

            <div className="relative flex-1 max-w-md group cursor-pointer" onClick={() => {
              const el = document.getElementById("pdf-selector-dropdown");
              if (el) el.classList.toggle("hidden");
            }}>
              <div className="flex items-center justify-between w-full bg-transparent border border-border/40 rounded-xl px-4 py-2.5 hover:bg-background-secondary/50 transition-colors">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Documento Activo</span>
                  <span className={`text-sm font-medium truncate ${selectedBookId ? "text-foreground" : "text-muted-foreground/70"}`}>
                    {selectedBookId ? initialBooks.find(b => b.id === selectedBookId)?.title : "Selecciona un PDF de tu biblioteca..."}
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground ml-2 shrink-0"><path d="m6 9 6 6 6-6" /></svg>
              </div>

              <div id="pdf-selector-dropdown" className="absolute top-full left-0 mt-2 w-full bg-background border border-border/60 rounded-xl shadow-xl z-50 hidden overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="max-h-[300px] overflow-y-auto p-1">
                  {initialBooks.map((b) => (
                    <div
                      key={b.id}
                      className={`flex flex-col px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${selectedBookId === b.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookChange(b.id);
                        document.getElementById("pdf-selector-dropdown")?.classList.add("hidden");
                      }}
                    >
                      <span className="text-sm truncate">{b.title}</span>
                      {b.subject && <span className="text-[10px] opacity-70 mt-0.5">{b.subject}</span>}
                    </div>
                  ))}
                  {initialBooks.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No hay PDFs en tu biblioteca
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(() => {
              if (!selectedBookId) return null;
              const book = initialBooks.find(b => b.id === selectedBookId);
              if (book && book.status !== "READY") {
                return (
                  <span className="text-xs text-warning flex items-center gap-1.5 font-medium bg-warning/10 px-3 py-1.5 rounded-lg ml-auto whitespace-nowrap">
                    <Loader2 className="size-3.5 animate-spin inline" /> Procesando
                  </span>
                );
              }
              return null;
            })()}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gradient-to-b from-transparent to-background/20 relative">
          {!selectedBookId ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-inner ring-4 ring-primary/5">
                <Search className="size-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Selecciona un Documento</h3>
              <p className="text-muted-foreground text-sm">
                Elige uno de los PDFs de tu biblioteca en el menú desplegable superior para buscar en su contenido.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-inner ring-4 ring-primary/5">
                <Search className="size-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Listo para buscar</h3>
              <p className="text-muted-foreground text-sm">
                Escribe una palabra clave o una frase para buscar coincidencias exactas y semánticas dentro del documento.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 sm:gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    } animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-2`}
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full mt-1 ${msg.role === "user" ? "bg-[var(--accent)] text-accent-foreground" : "bg-primary/10 text-primary ring-1 ring-primary/20"
                    }`}>
                    {msg.role === "user" ? <User className="size-4" /> : <Search className="size-4" />}
                  </div>
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl text-[15px] leading-relaxed shadow-sm overflow-hidden ${msg.role === "user"
                      ? "px-4 py-3 bg-[var(--accent)] text-accent-foreground rounded-tr-sm"
                      : "bg-background border border-border/50 text-foreground rounded-tl-sm"
                      }`}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <div className="flex flex-col">
                        {/* Always show the main AI response content if it exists */}
                        {msg.content && (
                          <div className="px-5 py-4 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 [&_strong]:font-semibold [&_strong]:text-foreground prose-a:text-primary">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}

                        {/* Si hay resultados de búsqueda, mostrarlos de forma limpia */}
                        {msg.searchResults ? (
                          <div className="p-1">
                            <div className="space-y-4">
                              {msg.searchResults.fragments.map((f, i) => (
                                <div
                                  key={i}
                                  className="rounded-xl border border-border/60 bg-background/50 hover:bg-background/80 transition-colors p-5 text-sm text-foreground-secondary leading-relaxed shadow-sm"
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-flex items-center rounded-md bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
                                      Página {f.pageNumber}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-foreground/90 whitespace-pre-wrap">{f.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4 flex-row animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full mt-1 bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Search className="size-4" />
                  </div>
                  <div className="px-5 py-4 rounded-2xl bg-background border border-border/50 rounded-tl-sm shadow-sm flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="size-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-border/40 bg-background/50 backdrop-blur-md">
          <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedBookId ? "Buscar en el documento (ej: concepto, definición)..." : "Selecciona un documento primero..."}
              disabled={!selectedBookId || loading}
              className="pr-12 py-6 rounded-2xl bg-background border-border/60 shadow-sm focus-visible:ring-primary/20 text-base"
              autoFocus
            />
            <Button
              type="submit"
              disabled={!input.trim() || !selectedBookId || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-10 p-0 rounded-xl"
            >
              <Send className="size-4" />
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              <Search className="size-3" /> Búsqueda en el sistema de documentos
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
