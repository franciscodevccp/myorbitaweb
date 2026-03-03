import { readFile } from "fs/promises";

// pdf-parse 1.x: se carga solo al usarlo para evitar que ejecute su bloque de test (lee test/data/...)
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

  // Custom page renderer to capture text per page accurately
  const render_page = async (pageData: any) => {
    // pageData has .pageIndex (0-based) and .getTextContent()
    const render_options = {
      // Replaces all occurrences of whitespace with standard spaces
      normalizeWhitespace: true,
      // Do not attempt to combine text items
      disableCombineTextItems: false
    };

    return pageData.getTextContent(render_options)
      .then(function (textContent: any) {
        let text = '';
        for (let item of textContent.items) {
          text += item.str + ' ';
        }
        return text;
      });
  };

  const options = {
    pagerender: render_page
  };

  const data = await pdfParse(buffer, options);

  // data.text will now contain the text of all pages joined by \n\n (which is what pdf-parse uses when joining pagerender results)
  // However, pdf-parse has a quirk: it prepends an extra \n\n. Let's split it carefully.
  const pages = data.text.split('\n\n').filter(p => p.trim() !== '');

  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i];

    // Attempt to split into paragraphs if there are large gaps, or just use chunks
    // Since we lost actual paragraph breaks in normalization, we can try to split by some logic,
    // or just break it down by length. For now, let's treat the whole page or large chunks as fragments.

    const chunks = pageText.match(/.{1,800}(\s|$)/g) || [pageText];

    chunks.forEach((chunk: string, index: number) => {
      const cleanText = chunk.replace(/\s+/g, " ").trim();
      if (cleanText.length >= 20) {
        fragments.push({
          pageNumber: i + 1,
          position: index + 1,
          content: cleanText,
        });
      }
    });
  }

  return {
    totalPages: data.numpages,
    fragments,
  };
}
