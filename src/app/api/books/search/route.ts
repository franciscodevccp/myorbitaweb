import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const searchQuerySchema = z.object({
  q: z.string().min(2).max(200),
  bookId: z.string().optional().nullable(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type SearchResultItem = {
  id: string;
  pageNumber: number;
  position: number;
  content: string;
  bookId: string;
  bookTitle: string;
  fileUrl: string;
  totalPages?: number;
  relevance?: number;
  highlighted: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = searchQuerySchema.safeParse({
    q: searchParams.get("q")?.trim() ?? "",
    bookId: searchParams.get("bookId") || null,
    limit: searchParams.get("limit") ?? "20",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos: " + (parsed.error.issues[0]?.message ?? "q requerido, mínimo 2 caracteres") },
      { status: 400 }
    );
  }

  const { q: query, bookId, limit: limitNum } = parsed.data;
  const limit = limitNum;

  try {
    const bookCondition = bookId ? `AND b.id = $3` : "";
    const params: (string | number)[] = [query, limit];
    if (bookId) params.push(bookId);

    const results = (await prisma.$queryRawUnsafe(
      `
    SELECT
      bf.id,
      bf."pageNumber",
      bf.position,
      bf.content,
      b.id AS "bookId",
      b.title AS "bookTitle",
      b."fileUrl",
      b."totalPages" AS "totalPages",
      ts_rank(bf.search_vector, query) AS relevance,
      ts_headline('spanish', bf.content, query,
        'StartSel=<mark>, StopSel=</mark>, MaxWords=60, MinWords=20'
      ) AS highlighted
    FROM "BookFragment" bf
    JOIN "Book" b ON b.id = bf."bookId"
    CROSS JOIN websearch_to_tsquery('spanish', $1) query
    WHERE bf.search_vector @@ query
      AND b.status = 'READY'
      ${bookCondition}
    ORDER BY relevance DESC
    LIMIT $2
  `,
      ...params
    )) as SearchResultItem[];

    return NextResponse.json({ results, query });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("search_vector") ||
      message.includes("column") ||
      message.includes("does not exist")
    ) {
      return fallbackSearch(query, limit, bookId ?? null);
    }
    console.error("[Search API]", err);
    return NextResponse.json(
      { error: "Error al buscar. ¿Ejecutaste la migración full-text?" },
      { status: 500 }
    );
  }
}

async function fallbackSearch(
  query: string,
  limit: number,
  bookId: string | null
) {
  const fragments = await prisma.bookFragment.findMany({
    where: {
      content: { contains: query, mode: "insensitive" },
      book: { status: "READY", ...(bookId ? { id: bookId } : {}) },
    },
    take: limit,
    include: { book: true },
    orderBy: { pageNumber: "asc" },
  });

  const results: SearchResultItem[] = fragments.map((bf) => {
    const re = new RegExp(`(${escapeRe(query)})`, "gi");
    const highlighted = bf.content.replace(
      re,
      "<mark>$1</mark>"
    ).slice(0, 400);
    if (bf.content.length > 400) {
      const idx = highlighted.lastIndexOf("</mark>");
      const end = idx > 0 ? idx + 7 : 400;
      return {
        id: bf.id,
        pageNumber: bf.pageNumber,
        position: bf.position,
        content: bf.content,
        bookId: bf.book.id,
        bookTitle: bf.book.title,
        fileUrl: bf.book.fileUrl,
        totalPages: bf.book.totalPages,
        highlighted: highlighted.slice(0, end) + "...",
      };
    }
    return {
      id: bf.id,
      pageNumber: bf.pageNumber,
      position: bf.position,
      content: bf.content,
      bookId: bf.book.id,
      bookTitle: bf.book.title,
      fileUrl: bf.book.fileUrl,
      totalPages: bf.book.totalPages,
      highlighted,
    };
  });

  return NextResponse.json({ results, query });
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
