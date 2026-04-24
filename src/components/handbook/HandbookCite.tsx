import { BookOpen, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHandbookReference, useHandbookLinksFor, type HandbookEntityType } from "@/hooks/useHandbook";
import { Skeleton } from "@/components/ui/skeleton";

interface HandbookCiteProps {
  /** Direct slug or UUID of a single reference */
  reference?: string;
  /** Or: pull all references attached to this entity */
  entityType?: HandbookEntityType;
  entityId?: string;
  variant?: "card" | "inline";
}

export function HandbookCite({ reference, entityType, entityId, variant = "card" }: HandbookCiteProps) {
  const single = useHandbookReference(reference);
  const linked = useHandbookLinksFor(
    entityType as HandbookEntityType,
    entityType ? entityId : undefined
  );

  if (reference) {
    if (single.isLoading) return <Skeleton className="h-20 w-full" />;
    if (!single.data) return null;
    return <CiteCard ref={single.data} variant={variant} />;
  }

  if (linked.isLoading) return <Skeleton className="h-20 w-full" />;
  if (!linked.data?.length) return null;

  return (
    <div className="space-y-2">
      {linked.data.map((r) => (
        <CiteCard key={r.id} ref={r} variant={variant} />
      ))}
    </div>
  );
}

function CiteCard({ ref, variant }: { ref: NonNullable<ReturnType<typeof useHandbookReference>["data"]>; variant: "card" | "inline" }) {
  if (variant === "inline") {
    return (
      <Link
        to={`/handbook/${ref.slug}`}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <BookOpen className="h-3.5 w-3.5" />
        {ref.title}
      </Link>
    );
  }
  return (
    <Link to={`/handbook/${ref.slug}`} className="block h-full">
      <Card className="h-full border-l-4 border-l-primary/60 bg-muted/30 transition-colors hover:border-primary/80 hover:bg-muted/50">
        <CardContent className="p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-medium text-sm">
              <BookOpen className="h-4 w-4 text-primary" />
              {ref.title}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </div>
            {ref.category?.name && (
              <Badge variant="secondary" className="text-xs">{ref.category.name}</Badge>
            )}
          </div>
          {ref.summary && <p className="text-xs text-muted-foreground">{ref.summary}</p>}
          {ref.formula && (
            <code className="block text-xs bg-background px-2 py-1 rounded border">{ref.formula}</code>
          )}
          {ref.source_citation && (
            <p className="text-[10px] text-muted-foreground italic">— {ref.source_citation}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
