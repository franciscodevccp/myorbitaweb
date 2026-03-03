"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { EventType, ReminderType } from "../../../../generated/prisma/client";

export type CalendarEventInput = {
    id?: string;
    title: string;
    description?: string | null;
    startDate: Date;
    endDate?: Date | null;
    allDay?: boolean;
    eventType: EventType;
    customTypeName?: string | null;
    color?: string | null;
    reminders?: {
        type: ReminderType;
        customMinutesBefore?: number | null;
    }[];
};

export async function getEvents() {
    try {
        const events = await prisma.calendarEvent.findMany({
            include: {
                reminders: true,
            },
            orderBy: {
                startDate: "asc",
            },
        });
        return events;
    } catch (error) {
        console.error("[Calendar] Error fetching events:", error);
        return [];
    }
}

export async function saveEvent(data: CalendarEventInput) {
    try {
        const { id, reminders, ...rest } = data;

        // Asegurar que las fechas sean Date (vienen serializadas como string desde el cliente)
        const startDate = rest.startDate instanceof Date ? rest.startDate : new Date(rest.startDate);
        const endDate = rest.endDate != null
            ? (rest.endDate instanceof Date ? rest.endDate : new Date(rest.endDate))
            : null;

        const eventData = {
            ...rest,
            startDate,
            endDate,
        };

        if (id) {
            await prisma.calendarEvent.update({
                where: { id },
                data: {
                    ...eventData,
                    reminders: {
                        deleteMany: {},
                        create: reminders?.map((r) => ({
                            type: r.type,
                            customMinutesBefore: r.customMinutesBefore,
                        })),
                    },
                },
            });
        } else {
            await prisma.calendarEvent.create({
                data: {
                    ...eventData,
                    reminders: {
                        create: reminders?.map((r) => ({
                            type: r.type,
                            customMinutesBefore: r.customMinutesBefore,
                        })),
                    },
                },
            });
        }

        revalidatePath("/dashboard/calendar");
        return { success: true };
    } catch (error) {
        console.error("[Calendar] Error saving event:", error);
        const message = error instanceof Error ? error.message : "No se pudo guardar el evento";
        return { success: false, error: message };
    }
}

export async function deleteEvent(id: string) {
    try {
        await prisma.calendarEvent.delete({
            where: { id },
        });
        revalidatePath("/dashboard/calendar");
        return { success: true };
    } catch (error) {
        console.error("[Calendar] Error deleting event:", error);
        return { success: false, error: "No se pudo eliminar el evento" };
    }
}
