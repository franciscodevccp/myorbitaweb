"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { CustomDatePicker } from "./custom-date-picker";
import { CustomTimePicker } from "./custom-time-picker";

export type DateTimeFieldProps = {
    value: Date;
    onChange: (date: Date) => void;
    allDay?: boolean;
    label: string;
    id?: string;
};

export function DateTimeField({
    value,
    onChange,
    allDay = false,
    label,
    id,
}: DateTimeFieldProps) {
    const [dateOpen, setDateOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);
    const [datePos, setDatePos] = useState({ top: 0, left: 0 });
    const [timePos, setTimePos] = useState({ top: 0, left: 0 });
    const dateTriggerRef = useRef<HTMLButtonElement>(null);
    const timeTriggerRef = useRef<HTMLButtonElement>(null);
    const dateDropdownRef = useRef<HTMLDivElement>(null);
    const timeDropdownRef = useRef<HTMLDivElement>(null);

    const CALENDAR_HEIGHT = 320;
    const TIME_PICKER_HEIGHT = 240;

    const updateDatePos = () => {
        const el = dateTriggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 16;
        const openAbove = spaceBelow < CALENDAR_HEIGHT;
        const top = openAbove ? rect.top - CALENDAR_HEIGHT - 6 : rect.bottom + 6;
        setDatePos({ top, left: rect.left });
    };

    const updateTimePos = () => {
        const el = timeTriggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 16;
        const openAbove = spaceBelow < TIME_PICKER_HEIGHT;
        const top = openAbove ? rect.top - TIME_PICKER_HEIGHT - 6 : rect.bottom + 6;
        setTimePos({ top, left: rect.left });
    };

    useLayoutEffect(() => {
        if (dateOpen) updateDatePos();
    }, [dateOpen]);

    useLayoutEffect(() => {
        if (timeOpen) updateTimePos();
    }, [timeOpen]);

    useEffect(() => {
        if (!dateOpen) return;
        const onOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const inTrigger = dateTriggerRef.current?.contains(target);
            const inDropdown = dateDropdownRef.current?.contains(target);
            if (!inTrigger && !inDropdown) setDateOpen(false);
        };
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, [dateOpen]);

    useEffect(() => {
        if (!timeOpen) return;
        const onOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const inTrigger = timeTriggerRef.current?.contains(target);
            const inDropdown = timeDropdownRef.current?.contains(target);
            if (!inTrigger && !inDropdown) setTimeOpen(false);
        };
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, [timeOpen]);

    const dateDisplay = format(value, "dd/MM/yyyy", { locale: es });
    const timeDisplay = format(value, "HH:mm", { locale: es });

    const handleDateChange = (d: Date) => {
        const next = new Date(value);
        next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <label
                className="text-[11px] font-bold tracking-wider uppercase text-[var(--muted-foreground)] ml-1 block"
                htmlFor={id}
            >
                {label}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
                {/* Fecha (siempre visible) */}
                <div className="relative flex-1 min-w-0 sm:min-w-[140px]">
                    <button
                        ref={dateTriggerRef}
                        type="button"
                        id={id}
                        onClick={() => {
                            setDateOpen((o) => !o);
                            setTimeOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] shadow-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-left"
                    >
                        <CalendarIcon className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                        <span className="tabular-nums">{dateDisplay}</span>
                    </button>
                    {dateOpen &&
                        typeof document !== "undefined" &&
                        createPortal(
                            <div
                                ref={dateDropdownRef}
                                className="fixed z-[9999]"
                                style={{ top: datePos.top, left: datePos.left }}
                            >
                                <CustomDatePicker
                                    value={value}
                                    onChange={handleDateChange}
                                    onClear={undefined}
                                />
                            </div>,
                            document.body
                        )}
                </div>

                {/* Hora (solo si no es todo el día) */}
                {!allDay && (
                    <div className="relative w-full sm:w-[100px] sm:shrink-0">
                        <button
                            ref={timeTriggerRef}
                            type="button"
                            onClick={() => {
                                setTimeOpen((o) => !o);
                                setDateOpen(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] shadow-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none sm:justify-start"
                        >
                            <Clock className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                            <span className="tabular-nums">{timeDisplay}</span>
                        </button>
                        {timeOpen &&
                            typeof document !== "undefined" &&
                            createPortal(
                                <div
                                    ref={timeDropdownRef}
                                    className="fixed z-[9999]"
                                    style={{ top: timePos.top, left: timePos.left }}
                                >
                                    <CustomTimePicker value={value} onChange={onChange} />
                                </div>,
                                document.body
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
