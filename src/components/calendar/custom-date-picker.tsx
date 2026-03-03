"use client";

import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export type CustomDatePickerProps = {
    value: Date;
    onChange: (date: Date) => void;
    onClear?: () => void;
    className?: string;
};

export function CustomDatePicker({
    value,
    onChange,
    onClear,
    className = "",
}: CustomDatePickerProps) {
    const monthStart = startOfMonth(value);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const handlePrevMonth = () => onChange(subMonths(value, 1));
    const handleNextMonth = () => onChange(addMonths(value, 1));
    const handleToday = () => onChange(new Date());

    return (
        <div
            className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg ${className}`}
            role="application"
            aria-label="Calendario"
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                    {format(value, "MMMM yyyy", { locale: es })}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="Mes anterior"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="Mes siguiente"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                {WEEKDAYS.map((d) => (
                    <div
                        key={d}
                        className="py-1.5 font-semibold text-[var(--muted-foreground)]"
                    >
                        {d}
                    </div>
                ))}
                {days.map((day) => {
                    const sameMonth = isSameMonth(day, monthStart);
                    const selected = isSameDay(day, value);
                    const today = isToday(day);
                    return (
                        <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => onChange(day)}
                            className={`
                                h-8 w-8 rounded-lg text-sm font-medium transition-colors
                                ${!sameMonth ? "text-[var(--muted)]" : "text-[var(--foreground)]"}
                                ${selected ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]" : "hover:bg-[var(--background-secondary)]"}
                                ${today && !selected ? "ring-1 ring-[var(--primary)]/50" : ""}
                            `}
                        >
                            {format(day, "d")}
                        </button>
                    );
                })}
            </div>
            <div className="mt-3 flex justify-between border-t border-[var(--border)]/50 pt-3">
                {onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="text-sm font-medium text-[var(--primary)] hover:underline"
                    >
                        Borrar
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleToday}
                    className="text-sm font-medium text-[var(--primary)] hover:underline ml-auto"
                >
                    Hoy
                </button>
            </div>
        </div>
    );
}
