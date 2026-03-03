"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { EventType } from "../../../generated/prisma/client";

export type EventTypeOption = { value: EventType; label: string; color?: string };

type EventTypeSelectProps = {
    value: EventType;
    options: EventTypeOption[];
    onChange: (value: EventType) => void;
    className?: string;
};

export function EventTypeSelect({
    value,
    options,
    onChange,
    className = "",
}: EventTypeSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find((o) => o.value === value) ?? options[0];

    useEffect(() => {
        if (!open) return;
        const onOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, [open]);

    return (
        <div ref={ref} className={`relative w-full sm:w-2/3 ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none"
            >
                <span>{selected.label}</span>
                <ChevronDown className={`w-4 h-4 text-[var(--muted-foreground)] shrink-0 ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute left-0 right-0 top-full z-[100] mt-1 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                            className={`
                                w-full px-4 py-2.5 text-left text-sm font-medium
                                ${value === opt.value
                                    ? "bg-[var(--primary-light)] text-[var(--primary)]"
                                    : "text-[var(--foreground)] hover:bg-[var(--background-secondary)]"}
                            `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
