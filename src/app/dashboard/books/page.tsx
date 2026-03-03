import { prisma } from "@/lib/db";
import { BooksPageClient } from "@/components/books/books-page-client";
import type { BookForList } from "@/lib/types";

export default async function BooksPage() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
  });

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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <BooksPageClient books={booksForList} />
    </div>
  );
}
