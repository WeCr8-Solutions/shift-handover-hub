import { useParams, Link, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { Helmet } from "react-helmet-async";
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

  const machineReadable = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: ref.title,
    description: ref.summary || undefined,
    keywords: ref.tags,
    dateModified: ref.updated_at,
    datePublished: ref.created_at,
    articleSection: ref.category?.name || undefined,
    identifier: ref.slug,
    url: `/handbook/${ref.slug}`,
    citation: ref.source_url || ref.source_citation || undefined,
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Helmet>
        <title>{`${ref.title} | Machinist's Reference | JobLine.ai`}</title>
        <meta name="description" content={ref.summary || `${ref.title} machinist handbook reference`} />
        <script type="application/ld+json">{JSON.stringify(machineReadable)}</script>
      </Helmet>

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
            <code className="block whitespace-pre-wrap break-words text-base font-mono">{ref.formula}</code>
            {ref.units && <p className="text-xs text-muted-foreground mt-1">Units: {ref.units}</p>}
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Machine-readable reference</p>
            <p className="text-sm text-muted-foreground">
              Structured metadata for formulas, tags, canonical status, and future diagram support.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Slug</p>
              <p className="font-mono break-all">{ref.slug}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Category</p>
              <p>{ref.category?.name || "Uncategorized"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Canonical</p>
              <p>{ref.is_canonical ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Updated</p>
              <p>{new Date(ref.updated_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Units</p>
              <p>{ref.units || "Not specified"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Tags</p>
              <p>{ref.tags.length ? ref.tags.join(", ") : "None"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-muted-foreground">Source</p>
              {ref.source_url ? (
                <a
                  href={ref.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline break-all"
                >
                  {ref.source_citation || ref.source_url}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <p>{ref.source_citation || "Not specified"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{ref.body_md}</ReactMarkdown>
      </article>

      {(ref.source_citation || ref.source_url) && (
        <p className="text-xs text-muted-foreground italic border-t pt-4">
          Source:{" "}
          {ref.source_url ? (
            <a
              href={ref.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              {ref.source_citation || ref.source_url}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            ref.source_citation
          )}
        </p>
      )}
    </div>
  );
}
