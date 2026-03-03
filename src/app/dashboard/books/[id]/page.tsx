import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BookViewClient } from "./book-view-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookViewPage({ params }: PageProps) {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id } });

  if (!book) notFound();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <BookViewClient
        book={{
          id: book.id,
          title: book.title,
          fileUrl: book.fileUrl,
          totalPages: book.totalPages,
        }}
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/books" aria-label="Volver a Biblioteca">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              {book.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {book.totalPages} páginas · Estado: {book.status}
            </p>
          </div>
        </div>
      </BookViewClient>
    </div>
  );
}
