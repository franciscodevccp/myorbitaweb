import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 });
  }

  const filePath = path.join(
    UPLOAD_DIR,
    "books",
    path.basename(book.fileUrl)
  );

  try {
    await unlink(filePath);
  } catch (err) {
    console.warn("[Delete] No se pudo borrar el archivo:", filePath, err);
  }

  await prisma.book.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
