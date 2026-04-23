import { useParams, Link, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHandbookReference } from "@/hooks/useHandbook";

export default function HandbookEntry() {
  const { slug } = useParams<{ slug: string }>();
  const { data: ref, isLoading } = useHandbookReference(slug);

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!ref) return <Navigate to="/handbook" replace />;

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link to="/handbook" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Handbook
      </Link>

      <header className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="h-5 w-5" />
          {ref.category?.name && <span className="text-sm font-medium">{ref.category.name}</span>}
        </div>
        <h1 className="text-3xl font-bold">{ref.title}</h1>
        {ref.summary && <p className="text-lg text-muted-foreground">{ref.summary}</p>}
        <div className="flex flex-wrap gap-1.5">
          {ref.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
          ))}
          {ref.difficulty && <Badge variant="outline" className="text-xs capitalize">{ref.difficulty}</Badge>}
        </div>
      </header>

      {ref.formula && (
        <Card className="bg-muted/40 border-primary/40">
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground mb-1">Formula</p>
            <code className="text-base font-mono">{ref.formula}</code>
            {ref.units && <p className="text-xs text-muted-foreground mt-1">Units: {ref.units}</p>}
          </CardContent>
        </Card>
      )}

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{ref.body_md}</ReactMarkdown>
      </article>

      {ref.source_citation && (
        <p className="text-xs text-muted-foreground italic border-t pt-4">
          Source: {ref.source_citation}
        </p>
      )}
    </div>
  );
}
