import { readFile } from "fs/promises";

function getPdfParse(): (buffer: Buffer, options?: any) => Promise<{ text: string; numpages: number }> {
  return require("pdf-parse");
}

export interface ExtractedFragment {
  pageNumber: number;
  position: number;
  content: string;
}

export async function extractPdfFragments(filePath: string): Promise<{
  totalPages: number;
  fragments: ExtractedFragment[];
}> {
  const buffer = await readFile(filePath);
  const fragments: ExtractedFragment[] = [];

  const pdfParse = getPdfParse();

  // Array externo para capturar texto por página individual
  const pageTexts: string[] = [];

  const render_page = async (pageData: any) => {
    const textContent = await pageData.getTextContent({
      normalizeWhitespace: true,
      disableCombineTextItems: false,
    });

    let text = "";
    for (const item of textContent.items) {
      // Detectar saltos de línea implícitos por cambio de posición Y
      if (item.hasEOL) {
        text += "\n";
      }
      text += item.str;
    }

    const cleaned = text.trim();
    pageTexts.push(cleaned);
    return cleaned;
  };

  const data = await pdfParse(buffer, { pagerender: render_page });

  // Ahora pageTexts[0] = página 1, pageTexts[1] = página 2, etc.
  for (let i = 0; i < pageTexts.length; i++) {
    const pageText = pageTexts[i];
    if (!pageText || pageText.length < 10) continue;

    // Intentar dividir en párrafos naturales (doble salto de línea)
    const rawParagraphs = pageText.split(/\n\s*\n/);

    let position = 0;
    for (const paragraph of rawParagraphs) {
      const cleaned = paragraph.replace(/\s+/g, " ").trim();

      if (cleaned.length < 20) continue;

      // Si un párrafo es muy largo (>800 chars), subdividir por oraciones
      if (cleaned.length > 800) {
        const sentences = cleaned.match(/[^.!?]+[.!?]+\s*/g) || [cleaned];
        let chunk = "";

        for (const sentence of sentences) {
          if ((chunk + sentence).length > 800 && chunk.length >= 20) {
            position++;
            fragments.push({
              pageNumber: i + 1,
              position,
              content: chunk.trim(),
            });
            chunk = sentence;
          } else {
            chunk += sentence;
          }
        }

        if (chunk.trim().length >= 20) {
          position++;
          fragments.push({
            pageNumber: i + 1,
            position,
            content: chunk.trim(),
          });
        }
      } else {
        position++;
        fragments.push({
          pageNumber: i + 1,
          position,
          content: cleaned,
        });
      }
    }
  }

  return {
    totalPages: data.numpages,
    fragments,
  };
}
