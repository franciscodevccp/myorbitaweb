import { prisma } from "@/lib/db";
import { getEvents } from "@/app/dashboard/calendar/actions";
import { getNotes } from "@/app/dashboard/notes/actions";
import { NotesPageClient } from "@/components/notes/notes-page-client";
import type { BookForList } from "@/lib/types";

export default async function NotesPage() {
  const [events, books, notes] = await Promise.all([
    getEvents(),
    prisma.book.findMany({ orderBy: { createdAt: "desc" } }),
    getNotes(),
  ]);

  const booksForList: BookForList[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    originalName: b.originalName,
    fileUrl: b.fileUrl,
    fileSize: b.fileSize,
    originalSize: b.originalSize,
    totalPages: b.totalPages,
    status: b.status,
    subject: b.subject,
    createdAt: b.createdAt,
  }));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <NotesPageClient
        initialEvents={events.map((e) => ({
          id: e.id,
          title: e.title,
          startDate: e.startDate,
        }))}
        initialBooks={booksForList}
        initialNotes={notes}
      />
    </div>
  );
}
