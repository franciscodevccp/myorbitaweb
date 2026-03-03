"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen } from "lucide-react";
import type { SearchResultItem } from "@/app/api/books/search/route";

interface SearchResultCardProps {
  result: SearchResultItem;
  onViewPdf: (result: SearchResultItem) => void;
  onExplainAi?: (result: SearchResultItem) => void;
}

export function SearchResultCard({
  result,
  onViewPdf,
  onExplainAi,
}: SearchResultCardProps) {
  return (
    <Card className="border-border/60 bg-card/40 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {result.bookTitle}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Página {result.pageNumber}
              {result.totalPages != null && ` de ${result.totalPages}`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className="text-sm text-foreground-secondary line-clamp-3 search-highlight"
          dangerouslySetInnerHTML={{ __html: result.highlighted }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={() => onViewPdf(result)}
          >
            <BookOpen className="size-3.5" />
            Ver en PDF
          </Button>
          {onExplainAi && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onExplainAi(result)}
            >
              <FileText className="size-3.5" />
              Explicar con IA
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
