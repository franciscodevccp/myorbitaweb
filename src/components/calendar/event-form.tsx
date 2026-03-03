"use client";

import { useState } from "react";
import { X, Clock, CalendarIcon, AlignLeft, Bot, Bell, Palette } from "lucide-react";
import type { ReminderType, EventType } from "../../../generated/prisma/client";
import { CalendarEventInput } from "@/app/dashboard/calendar/actions";
import ReminderConfig from "@/components/calendar/reminder-config";
import { DateTimeField } from "@/components/calendar/date-time-field";
import { EventTypeSelect } from "@/components/calendar/event-type-select";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export type EventFormProps = {
    initialData?: any;
    selectedDate?: Date;
    onClose: () => void;
    onSave: (data: CalendarEventInput) => Promise<{ success: boolean; error?: string } | void>;
    onDelete?: (id: string) => Promise<void>;
};

const EVENT_TYPES: { value: EventType; label: string }[] = [
    { value: "EXAM", label: "Examen" },
    { value: "ASSIGNMENT", label: "Entrega" },
    { value: "PRESENTATION", label: "Presentación" },
    { value: "CLASS", label: "Clase" },
    { value: "MEETING", label: "Reunión" },
    { value: "DEADLINE", label: "Corte" },
    { value: "OTHER", label: "Otro" },
];

const DEFAULT_EVENT_COLOR = "#8b6f5c";

function parseStoredColor(stored: string | null | undefined): string {
    if (!stored) return DEFAULT_EVENT_COLOR;
    if (/^#[0-9A-Fa-f]{6}$/.test(stored)) return stored;
    const varToHex: Record<string, string> = {
        "var(--primary)": "#8b6f5c",
        "var(--destructive)": "#c45c4a",
        "var(--info)": "#6e8a9a",
        "var(--warning)": "#c49a5c",
        "var(--success)": "#7c9a6e",
        "var(--muted)": "#6b5e54",
    };
    return varToHex[stored] ?? DEFAULT_EVENT_COLOR;
}

export default function EventForm({
    initialData,
    selectedDate,
    onClose,
    onSave,
    onDelete,
}: EventFormProps) {
    const isEditing = !!initialData?.id;

    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(
        initialData?.description || ""
    );
    const [allDay, setAllDay] = useState(initialData?.allDay || false);
    const [eventType, setEventType] = useState<EventType>(
        initialData?.eventType || "OTHER"
    );
    const [customTypeName, setCustomTypeName] = useState(
        initialData?.customTypeName ?? ""
    );
    const [eventColor, setEventColor] = useState(() =>
        parseStoredColor(initialData?.color)
    );

    // Parse Dates safely
    const defaultStart = new Date();
    if (selectedDate) {
        defaultStart.setTime(selectedDate.getTime());
        defaultStart.setHours(9, 0, 0, 0);
    }

    // Backend y resource del calendario usan startDate/endDate (no start/end)
    const initialStart = initialData?.startDate ?? initialData?.start;
    const initialEnd = initialData?.endDate ?? initialData?.end;
    const [startDate, setStartDate] = useState(
        initialStart ? new Date(initialStart) : defaultStart
    );

    const defaultEnd = new Date(
        (initialStart ? new Date(initialStart) : defaultStart).getTime() + 60 * 60 * 1000
    );
    const [endDate, setEndDate] = useState(
        initialEnd ? new Date(initialEnd) : defaultEnd
    );

    const [reminders, setReminders] = useState<{ type: ReminderType; customMinutesBefore?: number | null }[]>(
        initialData?.reminders?.map((r: any) => ({ type: r.type, customMinutesBefore: r.customMinutesBefore })) || []
    );

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSaving(true);
        setSaveError(null);

        try {
            const result = await onSave({
                id: initialData?.id,
                title,
                description,
                startDate,
                endDate: allDay ? null : endDate,
                allDay,
                eventType,
                customTypeName: eventType === "OTHER" ? (customTypeName?.trim() || null) : null,
                color: eventColor,
                reminders,
            });
            if (result && typeof result === "object" && result.success === false) {
                setSaveError(result.error ?? "No se pudo guardar el evento");
                return;
            }
            onClose();
        } catch (err) {
            console.error(err);
            setSaveError("No se pudo guardar el evento");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = () => setDeleteDialogOpen(true);

    const handleConfirmDelete = async () => {
        if (!isEditing || !onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(initialData.id);
            setDeleteDialogOpen(false);
            onClose();
        } catch (err) {
            console.error(err);
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-[var(--card)] w-full max-w-xl rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] border border-[var(--border)]/50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]/30 bg-[var(--background-secondary)]/10">
                    <h2 className="text-lg font-display font-medium text-[var(--foreground)]">
                        {isEditing ? "Editar Evento" : "Nuevo Evento"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-[var(--muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] focus:outline-none"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                    <form id="event-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
                        {/* Title Section */}
                        <div>
                            <input
                                type="text"
                                placeholder="Añade un título..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-2xl font-semibold bg-transparent border-0 placeholder-[var(--placeholder)] text-[var(--foreground)] focus:ring-0 px-0 focus:outline-none"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Details Section */}
                        <div className="flex flex-col gap-6">
                            {/* Row: Type + Color */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5 ml-1">
                                    <Bot className="w-3.5 h-3.5" /> Tipo de Evento
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                                    <div className="flex-1 min-w-0">
                                        <EventTypeSelect
                                            value={eventType}
                                            options={EVENT_TYPES}
                                            onChange={setEventType}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5 whitespace-nowrap">
                                            <Palette className="w-3.5 h-3.5" /> Color
                                        </label>
                                        <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-xl pl-2 pr-1 py-1">
                                            <input
                                                type="color"
                                                value={eventColor}
                                                onChange={(e) => setEventColor(e.target.value)}
                                                className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-[var(--border)] [&::-webkit-color-swatch]:rounded-md"
                                                title="Elegir color del evento"
                                            />
                                            <input
                                                type="text"
                                                value={eventColor}
                                                onChange={(e) => {
                                                    const v = e.target.value.trim();
                                                    if (/^#[0-9A-Fa-f]{6}$/.test(v) || v === "") setEventColor(v || DEFAULT_EVENT_COLOR);
                                                }}
                                                placeholder="#8b6f5c"
                                                className="w-20 bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted)] border-0 focus:outline-none focus:ring-0 font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {eventType === "OTHER" && (
                                    <input
                                        type="text"
                                        placeholder="Nombre del tipo de evento (ej. Reunión con tutor)"
                                        value={customTypeName}
                                        onChange={(e) => setCustomTypeName(e.target.value)}
                                        className="mt-1 w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none"
                                    />
                                )}
                            </div>

                            {/* Row: Date/Time */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5 ml-1">
                                    <Clock className="w-3.5 h-3.5" /> Fechas y Horas
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <DateTimeField
                                        label="Inicio"
                                        value={startDate}
                                        onChange={setStartDate}
                                        allDay={allDay}
                                        id="event-start"
                                    />
                                    {!allDay && (
                                        <DateTimeField
                                            label="Fin"
                                            value={endDate}
                                            onChange={setEndDate}
                                            allDay={false}
                                            id="event-end"
                                        />
                                    )}
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer w-fit group select-none mt-2 ml-1">
                                    <div className="relative flex items-center justify-center w-5 h-5 rounded-md border border-[var(--border)] group-hover:border-[var(--primary)] bg-[var(--background)] overflow-hidden">
                                        <input
                                            type="checkbox"
                                            checked={allDay}
                                            onChange={(e) => setAllDay(e.target.checked)}
                                            className="absolute opacity-0 w-full h-full cursor-pointer"
                                        />
                                        <div className={`w-full h-full bg-[var(--primary)] flex items-center justify-center ${allDay ? 'scale-100' : 'scale-0'}`}>
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-[var(--foreground-secondary)] group-hover:text-[var(--foreground)]">
                                        Todo el día
                                    </span>
                                </label>
                            </div>

                            {/* Row: Description */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5 ml-1">
                                    <AlignLeft className="w-3.5 h-3.5" /> Descripción
                                </label>
                                <textarea
                                    placeholder="Añade una descripción..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-[var(--background-secondary)]/30 border border-[var(--border)]/70 rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:bg-[var(--background)] focus:border-[var(--primary)] outline-none resize-none placeholder-[var(--muted-foreground)]"
                                />
                            </div>

                            {/* Row: Reminders */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5 ml-1">
                                    <Bell className="w-3.5 h-3.5" /> Recordatorios Telegram
                                </label>
                                <ReminderConfig reminders={reminders} onChange={setReminders} />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[var(--background-secondary)]/30 border-t border-[var(--border)]/50 flex flex-col gap-3">
                    {saveError && (
                        <p className="text-sm text-[var(--destructive)] font-medium" role="alert">
                            {saveError}
                        </p>
                    )}
                    <div className="flex items-center justify-between">
                    {isEditing ? (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                            className="text-sm font-semibold text-[var(--destructive)] hover:bg-[var(--destructive)]/10 px-4 py-2 rounded-xl disabled:opacity-50"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar Evento"}
                        </button>
                    ) : (
                        <div></div> // Spacing
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] px-5 py-2.5 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="event-form"
                            disabled={isSaving || !title.trim()}
                            className="text-sm font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] px-6 py-2.5 rounded-xl shadow-md shadow-[var(--primary)]/20 disabled:opacity-50"
                        >
                            {isSaving ? "Guardando..." : "Guardar Evento"}
                        </button>
                    </div>
                    </div>
                </div>
            </div>

            {/* Modal de confirmación para eliminar */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="border-[var(--border)] bg-[var(--card)] shadow-2xl rounded-2xl max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-[var(--foreground)]">
                            ¿Eliminar este evento?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[var(--muted-foreground)]">
                            Esta acción no se puede deshacer. El evento se eliminará permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel asChild disabled={isDeleting}>
                            <button
                                type="button"
                                className="text-sm font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] px-5 py-2.5 rounded-xl border-0 bg-transparent cursor-pointer"
                            >
                                Cancelar
                            </button>
                        </AlertDialogCancel>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="text-sm font-semibold bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/90 px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
