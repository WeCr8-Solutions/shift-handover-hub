import { useParams, useNavigate, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { HelpSidebar, HelpSearch, ArticleContent, TableOfContents, HelpBreadcrumb } from "@/components/help";
import { getArticle, getArticlesByCategory, helpCategories } from "@/lib/helpArticles";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, Menu, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";

export default function HelpArticle() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [helpful, setHelpful] = useState<boolean | null>(null);

  const article = category && slug ? getArticle(category, slug) : undefined;
  const categoryMeta = helpCategories.find((c) => c.key === category);
  const categoryArticles = category ? getArticlesByCategory(category) : [];
  const currentIndex = categoryArticles.findIndex((a) => a.slug === slug);
  const prevArticle = currentIndex > 0 ? categoryArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < categoryArticles.length - 1 ? categoryArticles[currentIndex + 1] : null;

  if (!article || !categoryMeta) {
    return (
      <>
        <MarketingNav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Article Not Found</h1>
            <p className="text-muted-foreground mb-4">The help article you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/help")}>Back to Help Center</Button>
          </div>
        </div>
        <MarketingFooter />
      </>
    );
  }

  const sidebar = <HelpSidebar />;

  return (
    <>
      <SEOHead
        title={`${article.title} - Help`}
        description={article.description}
        canonical={`/help/${category}/${slug}`}
        keywords={article.tags.join(", ")}
      />
      <MarketingNav />

      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-muted/30 py-3">
          <div className="container mx-auto px-4 flex items-center gap-3">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  {sidebar}
                </SheetContent>
              </Sheet>
            )}
            <HelpSearch className="flex-1 max-w-md" />
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex gap-0">
            {/* Sidebar (desktop) */}
            {!isMobile && (
              <aside className="w-64 shrink-0 border-r border-border">
                {sidebar}
              </aside>
            )}

            {/* Main content */}
            <main className="flex-1 min-w-0 px-6 py-8 max-w-3xl">
              <HelpBreadcrumb
                items={[
                  { label: "Help Center", to: "/help" },
                  { label: categoryMeta.label, to: `/help/${category}/${categoryArticles[0]?.slug}` },
                  { label: article.title },
                ]}
              />

              <ArticleContent article={article} />

              <AdPlacement format="in-article" className="my-8" />

              {/* Feedback */}
              <div className="border-t border-border pt-6 mt-8">
                <p className="text-sm text-muted-foreground mb-3">Was this article helpful?</p>
                <div className="flex gap-2">
                  <Button
                    variant={helpful === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHelpful(true)}
                    className="gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" /> Yes
                  </Button>
                  <Button
                    variant={helpful === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHelpful(false)}
                    className="gap-2"
                  >
                    <ThumbsDown className="h-4 w-4" /> No
                  </Button>
                </div>
                {helpful !== null && (
                  <p className="text-xs text-muted-foreground mt-2">Thanks for your feedback!</p>
                )}
              </div>

              {/* Prev / Next */}
              <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-border">
                {prevArticle ? (
                  <Link
                    to={`/help/${category}/${prevArticle.slug}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> {prevArticle.title}
                  </Link>
                ) : <span />}
                {nextArticle ? (
                  <Link
                    to={`/help/${category}/${nextArticle.slug}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {nextArticle.title} <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : <span />}
              </div>
            </main>

            {/* Table of Contents (desktop) */}
            {!isMobile && (
              <aside className="w-48 shrink-0 py-8 pl-4 hidden xl:block">
                <div className="sticky top-20">
                  <TableOfContents article={article} />
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      <MarketingFooter />
    </>
  );
}
