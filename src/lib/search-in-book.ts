import { prisma } from "@/lib/db";

export type SearchInBookResult = {
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

/**
 * Busca en el contenido indexado del libro. Usa full-text si existe search_vector; si no, ILIKE.
 */
export async function searchInBook(
  query: string,
  bookId: string,
  limit: number = 15
): Promise<SearchInBookResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const params: (string | number)[] = [trimmed, limit, bookId];

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
        ts_rank_cd(bf.search_vector, q) AS relevance,
        ts_headline('spanish', bf.content, q,
          'StartSel=<mark>, StopSel=</mark>, MaxWords=80, MinWords=25'
        ) AS highlighted
      FROM "BookFragment" bf
      JOIN "Book" b ON b.id = bf."bookId"
      CROSS JOIN websearch_to_tsquery('spanish', $1) q
      WHERE bf.search_vector @@ q AND b.id = $3 AND b.status = 'READY'
      ORDER BY relevance DESC
      LIMIT $2
      `,
      ...params
    )) as SearchInBookResult[];

    // If we got zero results with the OR OR query (unlikely, but possible), or it failed:
    if (results.length === 0) {
      return fallbackSearchInBook(trimmed, limit, bookId);
    }

    return results;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("search_vector") ||
      msg.includes("column") ||
      msg.includes("does not exist") ||
      msg.includes("syntax error") // to_tsquery can throw on weird characters
    ) {
      return fallbackSearchInBook(trimmed, limit, bookId);
    }
    throw err;
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function fallbackSearchInBook(
  query: string,
  limit: number,
  bookId: string
): Promise<SearchInBookResult[]> {
  const normalizedQuery = removeAccents(query);
  const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

  // We fetch a larger batch of pages for this book to filter in memory since Prisma
  // doesn't support accent-insensitive search natively without raw queries and extensions.
  // We'll just fetch all fragments for the book (or a large chunk) if it's not too huge, 
  // or we do a raw query with unaccent if available. 
  // For safety, let's just use Prisma to get the book's fragments and filter them.
  // If the book is huge this might be slow, but it's a fallback.
  const fragments = await prisma.bookFragment.findMany({
    where: {
      book: { status: "READY", id: bookId },
    },
    include: { book: true },
    orderBy: { pageNumber: "asc" },
  });

  const matchingFragments = [];

  for (const bf of fragments) {
    const lowerContent = removeAccents(bf.content.toLowerCase());
    let matchScore = 0;

    if (words.length > 0) {
      for (const w of words) {
        if (lowerContent.includes(w.toLowerCase())) {
          matchScore += 1;
        }
      }
      // If we want OR logic, we need at least 1 match
      if (matchScore > 0) {
        matchingFragments.push({ bf, matchScore });
      }
    } else {
      if (lowerContent.includes(normalizedQuery.toLowerCase())) {
        matchScore += 1;
        matchingFragments.push({ bf, matchScore });
      }
    }
  }

  // Define regex for highlighting (we have to build an accent-flexible regex to highlight correctly in the original accented text)
  // For simplicity, we'll just do a standard regex highlight on the original terms if they match, 
  // but it's hard to highlight "cadáver" when searching "cadaver". 
  // A simple trick is to ignore highlighting if it doesn't match perfectly, or we build a fuzzy regex.
  // We'll leave the highlight basic for now.

  const mappedFragments = matchingFragments.map(({ bf, matchScore }) => {
    // Try to highlight by creating a regex that allows optional accents for common vowels
    const fuzzyQuery = words.length > 0
      ? words.map(w => w.replace(/a/g, '[aá]').replace(/e/g, '[eé]').replace(/i/g, '[ií]').replace(/o/g, '[oó]').replace(/u/g, '[uú]')).join('|')
      : normalizedQuery.replace(/a/g, '[aá]').replace(/e/g, '[eé]').replace(/i/g, '[ií]').replace(/o/g, '[oó]').replace(/u/g, '[uú]');

    let highlighted = bf.content;
    try {
      const re = new RegExp(`(${fuzzyQuery})`, "gi");
      highlighted = bf.content.replace(re, "<mark>$1</mark>");
    } catch {
      // Ignorar si el regex falla
    }

    highlighted = highlighted.slice(0, 500) + (highlighted.length > 500 ? "..." : "");

    return {
      id: bf.id,
      pageNumber: bf.pageNumber,
      position: bf.position,
      content: bf.content,
      bookId: bf.book.id,
      bookTitle: bf.book.title,
      fileUrl: bf.book.fileUrl,
      totalPages: bf.book.totalPages ?? undefined,
      highlighted,
      relevance: matchScore,
    };
  });

  // Sort by highest match score, then by page number
  return mappedFragments
    .sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance! - a.relevance!;
      return a.pageNumber - b.pageNumber;
    })
    .slice(0, limit);
}
