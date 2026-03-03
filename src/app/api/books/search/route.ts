import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
  const query = searchParams.get("q")?.trim();
  const bookId = searchParams.get("bookId") || null;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Escribe al menos 2 caracteres para buscar." },
      { status: 400 }
    );
  }

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
    CROSS JOIN plainto_tsquery('spanish', $1) query
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
      return fallbackSearch(query, limit, bookId);
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
