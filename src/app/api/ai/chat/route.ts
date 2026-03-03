import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { searchInBook } from "@/lib/search-in-book";

const chatSchema = z.object({
  bookId: z.string().min(1).max(100),
  message: z.string().min(2).max(1000),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = chatSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos: " + (parsed.error.issues[0]?.message ?? "campos requeridos") },
                { status: 400 }
            );
        }

        const { bookId, message } = parsed.data;

        const book = await prisma.book.findUnique({
            where: { id: bookId },
            select: { id: true, title: true, status: true },
        });

        if (!book || book.status !== "READY") {
            return NextResponse.json(
                { error: "No se encontró el libro o aún no está indexado." },
                { status: 404 }
            );
        }

        // —— Búsqueda Directa en el Sistema ——
        let searchQuery = message.trim();
        let fragments = await searchInBook(searchQuery, bookId, 15);

        const userQueryClean = cleanForSearch(message);
        if (fragments.length === 0 && userQueryClean.length >= 2 && userQueryClean !== searchQuery) {
            fragments = await searchInBook(userQueryClean, bookId, 15);
        }

        if (fragments.length === 0 && userQueryClean.length >= 2) {
            const mainWord = pickMainSearchWord(userQueryClean);
            if (mainWord.length >= 2) fragments = await searchInBook(mainWord, bookId, 15);
        }

        if (fragments.length === 0) {
            return NextResponse.json({
                text: `No encontré resultados para "${message}" en este documento. Intenta usar palabras clave diferentes o más específicas.`,
                searchResults: null
            });
        }

        const searchResultsPayload = {
            bookTitle: book.title,
            fragments: fragments.map((f) => ({
                pageNumber: f.pageNumber,
                content: f.content,
            })),
        };

        return NextResponse.json({
            text: `He encontrado ${fragments.length} coincidencia(s) en el documento:`,
            searchResults: searchResultsPayload
        });
    } catch (error: unknown) {
        console.error("[SEARCH_ERROR]", error);
        return NextResponse.json(
            { error: "Ha ocurrido un error al procesar tu solicitud de búsqueda." },
            { status: 500 }
        );
    }
}

function cleanForSearch(message: string): string {
    // 1. Convertir a minúsculas y quitar acentos para la limpieza básica
    let cleaned = message.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar tildes
        .replace(/[¿¡?!.,;:"'()«»]/g, " ") // quitar puntuación
        .replace(/\s+/g, " ")
        .trim();

    // 2. Definir Stopwords en español (palabras que no aportan significado a la búsqueda)
    const stopwords = new Set([
        "a", "al", "algo", "algun", "alguna", "algunas", "algunos", "ante", "antes", "como", "con", "contra",
        "cual", "cuales", "cuando", "de", "del", "desde", "donde", "durante", "e", "el", "ella", "ellas",
        "ellos", "en", "entre", "era", "erais", "eran", "eras", "eres", "es", "esa", "esas", "ese", "eso",
        "esos", "esta", "estaba", "estabais", "estaban", "estabas", "estad", "estada", "estadas", "estado",
        "estados", "estamos", "estan", "estando", "estar", "estaremos", "estara", "estaran", "estaras",
        "estare", "estareis", "estaria", "estariais", "estariamos", "estarian", "estarias", "estas", "este",
        "estemos", "esto", "estos", "estoy", "estuve", "estuviera", "estuvierais", "estuvieran", "estuvieras",
        "estuvieron", "estuviese", "estuvieseis", "estuviesen", "estuvieses", "estuvimos", "estuviste",
        "estuvisteis", "estuvo", "fue", "fuera", "fuerais", "fueran", "fueras", "fueron", "fuese", "fueseis",
        "fuesen", "fueses", "fui", "fuimos", "fuiste", "fuisteis", "ha", "habia", "habiais", "habiamos",
        "habian", "habias", "habida", "habidas", "habido", "habidos", "habiendo", "habremos", "habra",
        "habran", "habras", "habre", "habreis", "habria", "habriais", "habriamos", "habrian", "habrias",
        "hace", "haceis", "hacemos", "hacen", "hacer", "haces", "hacia", "haciais", "haciamos", "hacian",
        "hacias", "hago", "han", "has", "hasta", "hay", "haya", "hayais", "hayamos", "hayan", "hayas", "he",
        "hecho", "hemos", "hicieron", "hizo", "hoy", "hubiera", "hubierais", "hubieramos", "hubieran",
        "hubieras", "hubieron", "hubiese", "hubieseis", "hubiesemos", "hubiesen", "hubieses", "hubimos",
        "hubiste", "hubisteis", "hubo", "la", "las", "le", "les", "lo", "los", "mas", "me", "mi", "mia",
        "mias", "mio", "mios", "mis", "mucho", "muchos", "muy", "nada", "nos", "nosotras", "nosotros",
        "nuestra", "nuestras", "nuestro", "nuestros", "o", "os", "otra", "otras", "otro", "otros", "para",
        "pero", "poco", "por", "porque", "q", "que", "quien", "quienes", "se", "sea", "seais", "seamos",
        "sean", "seas", "ser", "sera", "seran", "seras", "sere", "sereis", "seremos", "seria", "seriais",
        "seriamos", "serian", "serias", "si", "sido", "siendo", "sin", "sobre", "sois", "somos", "son",
        "soy", "su", "sus", "suya", "suyas", "suyo", "suyos", "tal", "tambien", "te", "tendre", "tendreis",
        "tendremos", "tendra", "tendran", "tendras", "tendria", "tendriais", "tendriamos", "tendrian",
        "tendrias", "tened", "teneis", "tenemos", "tenga", "tengais", "tengamos", "tengan", "tengas",
        "tengo", "tenia", "teniais", "teniamos", "tenian", "tenias", "tenida", "tenidas", "tenido", "tenidos",
        "teniendo", "tu", "tus", "tuve", "tuviera", "tuvierais", "tuvieramos", "tuvieran", "tuvieras",
        "tuvieron", "tuviese", "tuvieseis", "tuviesemos", "tuviesen", "tuvieses", "tuvimos", "tuviste",
        "tuvisteis", "tuvo", "tuya", "tuyas", "tuyo", "tuyos", "un", "una", "unas", "uno", "unos", "vosotras",
        "vosotros", "vuestra", "vuestras", "vuestro", "vuestros", "y", "ya",
        // Verbos comunes en preguntas que no sirven para buscar
        "describe", "describir", "explica", "explicar", "significa", "significado", "dime", "decir",
        "puedes", "podrias", "cuales", "como", "cuantos", "quien", "trata"
    ]);

    // 3. Filtrar las palabras
    const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));

    // Si filtró demasiado (ej, buscó exactamente "la o"), devolvemos la original limitada
    if (words.length === 0) {
        return message.replace(/[¿¡?!.,;:"'()«»]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
    }

    return words.join(" ").slice(0, 100);
}

/** Elige una palabra clave para buscar (la más larga o más rara). */
function pickMainSearchWord(cleaned: string): string {
    const words = cleaned.split(/\s+/).filter((w) => w.length >= 4);
    if (words.length === 0) return cleaned.split(/\s+/).find((w) => w.length >= 3) ?? cleaned.slice(0, 30);
    // Ordenar por longitud descendente (suele ser la palabra más "compleja" o específica)
    return words.sort((a, b) => b.length - a.length)[0];
}
