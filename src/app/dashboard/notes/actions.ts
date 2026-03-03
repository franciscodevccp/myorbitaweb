"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export type NoteInput = {
    id?: string;
    title: string;
    content: string;
    color?: string | null;
    bookIds?: string[];
    eventIds?: string[];
};

export async function getNotes() {
    try {
        return await prisma.note.findMany({
            include: {
                books: { select: { id: true, title: true } },
                events: { select: { id: true, title: true, startDate: true } },
            },
            orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        });
    } catch (error) {
        console.error("[Notes] Error fetching notes:", error);
        return [];
    }
}

export async function saveNote(data: NoteInput) {
    try {
        const { id, bookIds = [], eventIds = [], ...rest } = data;
        const base = {
            title: rest.title,
            content: rest.content,
            color: rest.color ?? null,
        };

        if (id) {
            await prisma.note.update({
                where: { id },
                data: {
                    ...base,
                    books: { set: bookIds.map((id) => ({ id })) },
                    events: { set: eventIds.map((id) => ({ id })) },
                },
            });
        } else {
            await prisma.note.create({
                data: {
                    ...base,
                    books: { connect: bookIds.map((id) => ({ id })) },
                    events: { connect: eventIds.map((id) => ({ id })) },
                },
            });
        }
        revalidatePath("/dashboard/notes");
        return { success: true };
    } catch (error) {
        console.error("[Notes] Error saving note:", error);
        const message = error instanceof Error ? error.message : "No se pudo guardar la nota";
        return { success: false, error: message };
    }
}

export async function deleteNote(id: string) {
    try {
        await prisma.note.delete({ where: { id } });
        revalidatePath("/dashboard/notes");
        return { success: true };
    } catch (error) {
        console.error("[Notes] Error deleting note:", error);
        return { success: false, error: "No se pudo eliminar la nota" };
    }
}
