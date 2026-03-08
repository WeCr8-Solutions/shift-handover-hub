import type { HelpArticle } from "@/lib/helpArticles";
import { cn } from "@/lib/utils";

interface TableOfContentsProps {
  article: HelpArticle;
  className?: string;
}

export function TableOfContents({ article, className }: TableOfContentsProps) {
  return (
    <nav className={cn("space-y-1", className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">On this page</p>
      {article.sections.map((section, i) => (
        <a
          key={i}
          href={`#section-${i}`}
          className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {section.heading}
        </a>
      ))}
    </nav>
  );
}
