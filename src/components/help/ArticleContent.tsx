import type { HelpArticle } from "@/lib/helpArticles";
import { Badge } from "@/components/ui/badge";
import { UseCaseRoutingPreview } from "./UseCaseRoutingPreview";

interface ArticleContentProps {
  article: HelpArticle;
}

export function ArticleContent({ article }: ArticleContentProps) {
  return (
    <article className="prose prose-sm max-w-none dark:prose-invert">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{article.title}</h1>
      <p className="text-muted-foreground text-base mb-4">{article.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-8">
        {article.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
      </div>

      <div className="space-y-8">
        {article.sections.map((section, i) => (
          <section key={i} id={`section-${i}`}>
            <h2 className="text-lg font-semibold text-foreground mb-2">{section.heading}</h2>
            <p className="text-foreground/90 leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>

      {article.category === "use-cases" && (
        <UseCaseRoutingPreview slug={article.slug} />
      )}
    </article>
  );
}
