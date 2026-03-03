import { NextResponse } from "next/server";
import { writeFile, mkdir, rename, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { compressPdf } from "@/lib/pdf-compressor";
import { extractPdfFragments } from "@/lib/pdf-processor";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const MAX_SIZE =
  (parseInt(process.env.MAX_PDF_SIZE_MB ?? "50", 10) || 50) * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const title = formData.get("title")?.toString()?.trim();
  const subject = formData.get("subject")?.toString()?.trim() ?? null;

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No se envió un archivo" },
      { status: 400 }
    );
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Solo se permiten archivos PDF" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      {
        error: `El archivo supera el límite de ${process.env.MAX_PDF_SIZE_MB ?? 50} MB`,
      },
      { status: 400 }
    );
  }

  const bookTitle = title ?? file.name.replace(/\.pdf$/i, "");
  const timestamp = Date.now();
  const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const booksDir = path.join(UPLOAD_DIR, "books");

  await mkdir(booksDir, { recursive: true });

  const tempPath = path.join(booksDir, `temp-${safeName}`);
  const finalPath = path.join(booksDir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(tempPath, buffer);

  const compression = await compressPdf(tempPath, finalPath);

  if (compression.success) {
    await unlink(tempPath);
  } else {
    await rename(tempPath, finalPath);
  }

  const book = await prisma.book.create({
    data: {
      title: bookTitle,
      originalName: file.name,
      fileUrl: `/uploads/books/${safeName}`,
      fileSize: compression.success
        ? compression.compressedSize
        : compression.originalSize,
      originalSize: compression.originalSize,
      subject,
      status: "PROCESSING",
    },
  });

  extractAndIndex(book.id, finalPath).catch((err) => {
    console.error(`[Upload] Error procesando ${book.id}:`, err);
  });

  return NextResponse.json({
    book: {
      id: book.id,
      title: book.title,
      status: book.status,
      fileSize: book.fileSize,
      originalSize: book.originalSize,
      compressionRatio: compression.success
        ? Math.round(
            (1 - compression.compressedSize / compression.originalSize) * 100
          )
        : 0,
    },
  });
}

async function extractAndIndex(bookId: string, filePath: string) {
  try {
    const { totalPages, fragments } = await extractPdfFragments(filePath);

    for (let i = 0; i < fragments.length; i += 100) {
      const batch = fragments.slice(i, i + 100);
      await prisma.bookFragment.createMany({
        data: batch.map((f) => ({
          bookId,
          pageNumber: f.pageNumber,
          position: f.position,
          content: f.content,
        })),
      });
    }

    await prisma.book.update({
      where: { id: bookId },
      data: { status: "READY", totalPages },
    });
  } catch (error) {
    console.error("[Extract] Error:", error);
    await prisma.book.update({
      where: { id: bookId },
      data: { status: "ERROR" },
    });
  }
}
