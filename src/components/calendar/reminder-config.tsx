"use client";

import type { ReminderType } from "../../../generated/prisma/client";
import { Check } from "lucide-react";

type ReminderOption = {
    type: ReminderType;
    label: string;
};

const OPTIONS: ReminderOption[] = [
    { type: "AT_TIME", label: "A la hora del evento" },
    { type: "MINUTES_15", label: "15 minutos antes" },
    { type: "MINUTES_30", label: "30 minutos antes" },
    { type: "HOUR_1", label: "1 hora antes" },
    { type: "HOUR_2", label: "2 horas antes" },
    { type: "DAY_1", label: "1 día antes" },
    { type: "WEEK_1", label: "1 semana antes" },
];

type ReminderConfigProps = {
    reminders: { type: ReminderType; customMinutesBefore?: number | null }[];
    onChange: (reminders: { type: ReminderType; customMinutesBefore?: number | null }[]) => void;
};

export default function ReminderConfig({ reminders, onChange }: ReminderConfigProps) {
    const isSelected = (type: ReminderType) => reminders.some((r) => r.type === type);

    const toggleReminder = (type: ReminderType) => {
        if (isSelected(type)) {
            onChange(reminders.filter((r) => r.type !== type));
        } else {
            onChange([...reminders, { type }]);
        }
    };

    return (
        <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {OPTIONS.map((option) => {
                    const active = isSelected(option.type);
                    return (
                        <button
                            key={option.type}
                            type="button"
                            onClick={() => toggleReminder(option.type)}
                            className={`
                                relative flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase
                                ${active
                                    ? "bg-[var(--primary)] text-white border border-[var(--primary)] shadow-sm"
                                    : "bg-[var(--background)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] border border-[var(--border)]/70 hover:border-[var(--border)] shadow-sm"
                                }
                            `}
                        >
                            {active && <Check className="w-3.5 h-3.5" />}
                            {option.label}
                        </button>
                    );
                })}
            </div>
            <p className="text-[11.5px] text-[var(--muted-foreground)] font-medium bg-[var(--background-secondary)]/30 inline-block px-3 py-1.5 rounded-lg w-fit">
                Recibirás una notificación en Telegram para las opciones seleccionadas.
            </p>
        </div>
    );
}
