"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { StickyNote, Calendar, BookOpen, Palette, Loader2, Trash2, Pencil, Plus, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveNote, deleteNote, getNotes, type NoteInput } from "@/app/dashboard/notes/actions";
import type { BookForList } from "@/lib/types";

const DEFAULT_NOTE_COLOR = "#e8ddd4";
const PRESET_COLORS = [
  "#e8ddd4",
  "#fcd2b8",
  "#f3b9b4",
  "#badae8",
  "#c8e6c9",
  "#e1bee7",
  "#fff9c4",
];

type EventOption = { id: string; title: string; startDate: Date };
type NoteWithRelations = Awaited<ReturnType<typeof getNotes>>[number];

type CustomSelectOption = { value: string; label: string };

function CustomMultiSelect({
  values,
  options,
  onChange,
  placeholder = "Seleccionar",
}: {
  values: string[];
  options: CustomSelectOption[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((o) => values.includes(o.value));

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const toggleOption = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-h-9 items-center justify-between gap-2 rounded-md border border-[var(--input)] bg-transparent px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          {selectedOptions.length === 0 ? (
            <span className="text-[var(--muted-foreground)] py-0.5">{placeholder}</span>
          ) : (
            selectedOptions.map((sel) => (
              <span
                key={sel.value}
                className="inline-flex items-center gap-1 bg-[var(--primary-light)]/50 text-[var(--primary)] px-2 py-0.5 rounded text-xs font-medium border border-[var(--primary-light)]/50"
              >
                {sel.label.split('—')[0].trim()}
                <span
                  className="cursor-pointer hover:bg-[var(--primary)]/20 rounded-full p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(sel.value);
                  }}
                >
                  <X className="size-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--muted-foreground)] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-60 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--card)] shadow-lg p-1">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No hay opciones</div>
          ) : (
            options.map((opt) => {
              const isSelected = values.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleOption(opt.value);
                  }}
                  className={`
                    w-full px-3 py-2 text-left text-sm font-medium truncate rounded-sm mb-0.5 last:mb-0
                    ${isSelected
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : "text-[var(--foreground)] hover:bg-[var(--background-secondary)]"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className={`size-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)]'}`}>
                      {isSelected && <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

interface NotesPageClientProps {
  initialEvents: EventOption[];
  initialBooks: BookForList[];
  initialNotes: NoteWithRelations[];
}

export function NotesPageClient({
  initialEvents,
  initialBooks,
  initialNotes,
}: NotesPageClientProps) {
  const [notes, setNotes] = useState<NoteWithRelations[]>(initialNotes);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [bookIds, setBookIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(DEFAULT_NOTE_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setEventIds([]);
    setBookIds([]);
    setTitle("");
    setContent("");
    setColor(DEFAULT_NOTE_COLOR);
    setEditingId(null);
    setSaveError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const loadNoteForEdit = (note: NoteWithRelations) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color || DEFAULT_NOTE_COLOR);
    setEventIds(note.events?.map((e: { id: string }) => e.id) ?? []);
    setBookIds(note.books?.map((b: { id: string }) => b.id) ?? []);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const data: NoteInput = {
        id: editingId || undefined,
        title: title.trim(),
        content: content.trim(),
        color: color || null,
        bookIds,
        eventIds,
      };
      const result = await saveNote(data);
      if (result?.success === false) {
        setSaveError(result.error || "Error al guardar");
        return;
      }
      const updated = await getNotes();
      setNotes(updated);
      resetForm();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteNote(id);
      setNotes(await getNotes());
    } finally {
      setDeletingId(null);
    }
  };

  const events: EventOption[] = initialEvents.map((e) => ({
    id: e.id,
    title: e.title,
    startDate: e.startDate instanceof Date ? e.startDate : new Date(e.startDate),
  }));

  const noteForm = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
            <Calendar className="size-4" />
            Eventos
          </label>
          <CustomMultiSelect
            values={eventIds}
            onChange={setEventIds}
            placeholder="Selecciona uno o más eventos"
            options={events.map((ev) => ({
              value: ev.id,
              label: `${ev.title} — ${format(ev.startDate, "d MMM yyyy", { locale: es })}`,
            }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
            <BookOpen className="size-4" />
            Libros
          </label>
          <CustomMultiSelect
            values={bookIds}
            onChange={setBookIds}
            placeholder="Selecciona uno o más libros"
            options={initialBooks.map((b) => ({
              value: b.id,
              label: b.title,
            }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--foreground)]">Título de la nota</label>
        <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Resumen del capítulo 3"
            className="max-w-md"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">Descripción</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe el contenido de la nota..."
            rows={4}
            className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-y min-h-[100px]"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
            <Palette className="size-4" />
            Color
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={`size-8 rounded-full border-2 transition-transform ${color === preset ? "border-[var(--primary)] scale-110 shadow-sm" : "border-transparent hover:scale-105"
                    }`}
                  style={{ backgroundColor: preset }}
                  aria-label={`Seleccionar color ${preset}`}
                />
              ))}
            </div>
            <div className="h-6 w-px bg-[var(--border)] mx-1" />
            <div className="relative size-8 shrink-0 group">
              <div
                className="absolute inset-0 rounded-full border border-[var(--border)] shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: color }}
              />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Color personalizado"
              />
            </div>
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-[var(--destructive)]">{saveError}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {editingId ? "Guardar cambios" : "Crear nota"}
          </Button>
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
        </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            <StickyNote className="size-3.5" />
            Notas
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-[var(--foreground)]">
            Notas
          </h1>
          <p className="text-[var(--foreground-secondary)]">
            Vincula notas a eventos o libros. Título, descripción y color.
          </p>
        </div>
        <Button onClick={openCreateModal} className="shrink-0">
          <Plus className="size-4 mr-2" />
          Nueva nota
        </Button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[var(--card)] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]/50">
              <h2 className="text-lg font-display font-medium text-[var(--foreground)]">
                {editingId ? "Editar nota" : "Nueva nota"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-full text-[var(--muted-foreground)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] focus:outline-none"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {noteForm}
            </div>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
          Tus notas
        </h2>
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-secondary)]/30">
            <div className="size-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-4">
              <StickyNote className="size-6" />
            </div>
            <h3 className="font-medium text-[var(--foreground)] mb-1">
              No hay notas
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-6">
              Empieza a organizar tu información creando tu primera nota, y vincúlala a un evento o libro si lo deseas.
            </p>
            <Button onClick={openCreateModal}>
              <Plus className="size-4 mr-2" />
              Crear primera nota
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="group relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1.5 rounded-t-xl opacity-80"
                  style={{ backgroundColor: note.color || DEFAULT_NOTE_COLOR }}
                />
                <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                  <h3 className="font-medium text-[var(--foreground)] line-clamp-2 flex-1 leading-tight">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => loadNoteForEdit(note)}
                      aria-label="Editar"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                      aria-label="Eliminar"
                    >
                      {deletingId === note.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5 text-[var(--destructive)]" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {note.events?.map((ev: { id: string; title: string }) => (
                    <span key={ev.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--primary-light)]/50 text-[var(--primary)] border border-[var(--primary-light)]/50">
                      <Calendar className="size-3 shrink-0" />
                      <span className="truncate max-w-[120px]">{ev.title}</span>
                    </span>
                  ))}
                  {note.books?.map((b: { id: string; title: string }) => (
                    <span key={b.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--background-secondary)] text-[var(--foreground-secondary)] border border-[var(--border)]">
                      <BookOpen className="size-3 shrink-0" />
                      <span className="truncate max-w-[120px]">{b.title}</span>
                    </span>
                  ))}
                </div>
                <p className="text-sm text-[var(--foreground-secondary)] line-clamp-4 flex-1 whitespace-pre-wrap">
                  {note.content || "—"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  {format(new Date(note.updatedAt), "d MMM yyyy, HH:mm", { locale: es })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
