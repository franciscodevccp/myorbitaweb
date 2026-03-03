import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractPdfFragments } from "@/lib/pdf-processor";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const books = await prisma.book.findMany({
    where: { status: "READY" },
  });

  const results = [];

  for (const book of books) {
    const filePath = path.join(UPLOAD_DIR, "books", path.basename(book.fileUrl));

    try {
      // Borrar fragmentos existentes
      await prisma.bookFragment.deleteMany({ where: { bookId: book.id } });

      // Re-extraer
      const { totalPages, fragments } = await extractPdfFragments(filePath);

      // Insertar en batches
      for (let i = 0; i < fragments.length; i += 100) {
        const batch = fragments.slice(i, i + 100);
        await prisma.bookFragment.createMany({
          data: batch.map((f) => ({
            bookId: book.id,
            pageNumber: f.pageNumber,
            position: f.position,
            content: f.content,
          })),
        });
      }

      await prisma.book.update({
        where: { id: book.id },
        data: { totalPages },
      });

      results.push({ id: book.id, title: book.title, fragments: fragments.length, ok: true });
    } catch (err) {
      console.error(`[Reindex] Error en ${book.id}:`, err);
      results.push({ id: book.id, title: book.title, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({ reindexed: results.length, results });
}
