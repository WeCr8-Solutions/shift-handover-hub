import { Link, useParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { helpCategories, getArticlesByCategory } from "@/lib/helpArticles";

export function HelpSidebar() {
  const { category: activeCategory, slug: activeSlug } = useParams();

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <nav className="py-6 pr-4 pl-2 space-y-1">
        {helpCategories.map((cat) => {
          const articles = getArticlesByCategory(cat.key);
          const isActiveCategory = activeCategory === cat.key;

          return (
            <Collapsible key={cat.key} defaultOpen={isActiveCategory}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md group">
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                <cat.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{cat.label}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="ml-5 pl-4 border-l border-border space-y-0.5 py-1">
                  {articles.map((article) => (
                    <li key={article.slug}>
                      <Link
                        to={`/help/${cat.key}/${article.slug}`}
                        className={cn(
                          "block px-3 py-1.5 text-sm rounded-md transition-colors",
                          isActiveCategory && activeSlug === article.slug
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
