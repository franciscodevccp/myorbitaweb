"use client";

import { useRef, useEffect } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export type CustomTimePickerProps = {
    value: Date;
    onChange: (date: Date) => void;
    className?: string;
};

function pad(n: number) {
    return n.toString().padStart(2, "0");
}

export function CustomTimePicker({
    value,
    onChange,
    className = "",
}: CustomTimePickerProps) {
    const hour = value.getHours();
    const minute = value.getMinutes();
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hEl = hourRef.current?.querySelector(`[data-hour="${hour}"]`);
        const mEl = minuteRef.current?.querySelector(`[data-minute="${minute}"]`);
        hEl?.scrollIntoView({ block: "center", behavior: "auto" });
        mEl?.scrollIntoView({ block: "center", behavior: "auto" });
    }, [hour, minute]);

    const setHour = (h: number) => {
        const d = new Date(value);
        d.setHours(h, minute, 0, 0);
        onChange(d);
    };
    const setMinute = (m: number) => {
        const d = new Date(value);
        d.setHours(hour, m, 0, 0);
        onChange(d);
    };

    return (
        <div
            className={`flex rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-lg ${className}`}
            role="application"
            aria-label="Hora"
        >
            <div
                ref={hourRef}
                className="h-[220px] w-[72px] overflow-y-auto overflow-x-hidden scroll-smooth bg-[var(--background)]/50 scrollbar-hide py-2"
            >
                {HOURS.map((h) => {
                    const selected = h === hour;
                    return (
                        <button
                            key={h}
                            type="button"
                            data-hour={h}
                            onClick={() => setHour(h)}
                            className={`
                                w-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center
                                ${selected ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--foreground)] hover:bg-[var(--background-secondary)]"}
                            `}
                        >
                            {pad(h)}
                        </button>
                    );
                })}
            </div>
            <div className="w-px bg-[var(--border)] shrink-0" />
            <div
                ref={minuteRef}
                className="h-[220px] w-[72px] overflow-y-auto overflow-x-hidden scroll-smooth bg-[var(--background)]/50 scrollbar-hide py-2"
            >
                {MINUTES.map((m) => {
                    const selected = m === minute;
                    return (
                        <button
                            key={m}
                            type="button"
                            data-minute={m}
                            onClick={() => setMinute(m)}
                            className={`
                                w-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center
                                ${selected ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--foreground)] hover:bg-[var(--background-secondary)]"}
                            `}
                        >
                            {pad(m)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
