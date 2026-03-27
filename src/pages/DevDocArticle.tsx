import { useParams, useNavigate, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { DevSidebar } from "@/components/dev/DevSidebar";
import { DevSearch } from "@/components/dev/DevSearch";
import { DevCodeBlock } from "@/components/dev/DevCodeBlock";
import { getDevDoc, getDevDocsByCategory, devCategories } from "@/lib/devDocs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

export default function DevDocArticle() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const doc = category && slug ? getDevDoc(category, slug) : undefined;
  const categoryMeta = devCategories.find((c) => c.key === category);
  const categoryDocs = category ? getDevDocsByCategory(category) : [];
  const currentIndex = categoryDocs.findIndex((d) => d.slug === slug);
  const prevDoc = currentIndex > 0 ? categoryDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < categoryDocs.length - 1 ? categoryDocs[currentIndex + 1] : null;

  if (!doc || !categoryMeta) {
    return (
      <>
        <MarketingNav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Doc Not Found</h1>
            <p className="text-muted-foreground mb-4">The developer doc you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/dev")}>Back to Developer Portal</Button>
          </div>
        </div>
        <MarketingFooter />
      </>
    );
  }

  const sidebar = <DevSidebar />;

  return (
    <>
      <SEOHead
        title={`${doc.title} — Developer Docs`}
        description={doc.description}
        canonical={`/dev/${category}/${slug}`}
        keywords={doc.tags.join(", ")}
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
            <DevSearch className="flex-1 max-w-md" />
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
            <main className="flex-1 min-w-0 px-4 sm:px-6 py-8 max-w-3xl">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
                <Link to="/dev" className="hover:text-foreground transition-colors">Docs</Link>
                <ChevronRight className="h-3 w-3" />
                <Link to={`/dev/${category}/${categoryDocs[0]?.slug}`} className="hover:text-foreground transition-colors">{categoryMeta.label}</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium truncate">{doc.title}</span>
              </nav>

              <article className="prose prose-sm max-w-none dark:prose-invert">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{doc.title}</h1>
                <p className="text-muted-foreground text-base mb-4">{doc.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>

                {/* Code examples (top) */}
                {doc.codeExamples && doc.codeExamples.length > 0 && (
                  <DevCodeBlock examples={doc.codeExamples} className="mb-8" />
                )}

                <div className="space-y-8">
                  {doc.sections.map((section, i) => (
                    <section key={i} id={`section-${i}`}>
                      <h2 className="text-lg font-semibold text-foreground mb-2">{section.heading}</h2>
                      <p className="text-foreground/90 leading-relaxed">{section.body}</p>
                    </section>
                  ))}
                </div>
              </article>

              {/* Prev / Next */}
              <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-border">
                {prevDoc ? (
                  <Link
                    to={`/dev/${category}/${prevDoc.slug}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> {prevDoc.title}
                  </Link>
                ) : <span />}
                {nextDoc ? (
                  <Link
                    to={`/dev/${category}/${nextDoc.slug}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {nextDoc.title} <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : <span />}
              </div>
            </main>

            {/* Table of Contents (desktop) */}
            {!isMobile && (
              <aside className="w-48 shrink-0 py-8 pl-4 hidden xl:block">
                <div className="sticky top-20">
                  <nav className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">On this page</p>
                    {doc.sections.map((section, i) => (
                      <a
                        key={i}
                        href={`#section-${i}`}
                        className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        {section.heading}
                      </a>
                    ))}
                  </nav>
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
