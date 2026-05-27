import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, ArrowRight } from "lucide-react";
import { AMAZON_BOOKS, type AmazonBook, type BookRole, getAmazonUrl } from "@/lib/amazonBooks";

/**
 * Essential Reading — curated manufacturing book library.
 * Book data + URL resolution live in src/lib/amazonBooks.ts so the
 * gated admin page at /admin/amazon-links can manage every Amazon URL
 * and affiliate tag from one place.
 */

const ROLES: BookRole[] = [
  "Operator",
  "Machinist / Programmer",
  "Quality",
  "Lean / CI",
  "Supervisor",
  "Manufacturing Engineer",
  "Owner / Manager",
];

const ROLE_BLURBS: Record<BookRole, string> = {
  Operator: "Start with a pocket reference and one CNC primer. Build the habit of looking things up.",
  "Machinist / Programmer": "Master the standard programming text, then anchor every shift with Machinery's Handbook on the bench.",
  Quality: "Deming and Juran are non-negotiable. Add Shewhart and Ishikawa to teach the floor common-cause vs. special-cause.",
  "Lean / CI": "Read the source (Ohno, Shingo) before the secondary literature. Then Womack and Liker for the management vocabulary.",
  Supervisor: "Goldratt and Imai are the two highest-leverage books a supervisor can read this quarter.",
  "Manufacturing Engineer": "Factory Physics for the math, Juran for quality, Ohno/Shingo for the philosophy that ties it together.",
  "Owner / Manager": "The Goal, The Machine That Changed the World, and Out of the Crisis — three books that pay back every hour invested.",
};

function BookCard({ book }: { book: AmazonBook }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className="text-xs">{book.category}</Badge>
          {book.year && <span className="text-xs text-muted-foreground">{book.year}</span>}
        </div>
        <CardTitle className="text-base leading-snug">{book.title}</CardTitle>
        <CardDescription className="text-xs">{book.author}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{book.why}</p>
        <Button asChild variant="outline" size="sm" className="w-full">
          <a
            href={getAmazonUrl(book.asin)}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            aria-label={`View ${book.title} on Amazon`}
          >
            View on Amazon
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function EssentialReading() {
  const [activeRole, setActiveRole] = useState<BookRole | "All">("All");

  const visible = useMemo(() => {
    if (activeRole === "All") return AMAZON_BOOKS;
    return AMAZON_BOOKS.filter((b) => b.roles.includes(activeRole));
  }, [activeRole]);

  const itemList = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Essential Manufacturing Reading List",
      itemListElement: AMAZON_BOOKS.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Book",
          name: b.title,
          author: b.author,
          url: getAmazonUrl(b.asin),
        },
      })),
    }),
    [],
  );

  return (
    <>
      <SEOHead
        title="Essential Manufacturing Reading — Books by Role & Profession | JobLine.ai"
        description="Curated reading list for machinists, quality engineers, supervisors, and shop owners. Machinery's Handbook, Toyota Production System, The Goal, Deming, Juran, and more — organized by profession."
        canonical="https://jobline.ai/resources/essential-reading"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <div className="min-h-screen bg-background">
        <MarketingNav />
        <main className="container py-12 max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
            <Link to="/resources" className="hover:text-foreground">Resources</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Essential Reading</span>
          </nav>

          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Essential Manufacturing Reading</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              The books we hand to new operators, programmers, quality engineers, and shop owners. Curated for
              precision machining — references you'll actually open, philosophy worth the weekend, and the
              foundational texts behind every modern shop floor.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Amazon links — we may swap these for affiliate links later.
            </p>
          </header>

          <AdPlacement format="horizontal" className="mb-8" />

          <section aria-label="Filter by role" className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              By profession
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeRole === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveRole("All")}
              >
                All ({AMAZON_BOOKS.length})
              </Button>
              {ROLES.map((role) => {
                const count = AMAZON_BOOKS.filter((b) => b.roles.includes(role)).length;
                return (
                  <Button
                    key={role}
                    variant={activeRole === role ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveRole(role)}
                  >
                    {role} ({count})
                  </Button>
                );
              })}
            </div>
            {activeRole !== "All" && (
              <p className="text-sm text-muted-foreground mt-4 max-w-3xl leading-relaxed">
                <strong className="text-foreground">For {activeRole.toLowerCase()}s:</strong>{" "}
                {ROLE_BLURBS[activeRole]}
              </p>
            )}
          </section>

          <section aria-label="Books" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {visible.map((b) => (
              <BookCard key={b.asin} book={b} />
            ))}
          </section>

          <AdPlacement format="rectangle" className="mb-12" />

          <section className="border-t pt-10">
            <h2 className="text-2xl font-bold mb-4">Pair the reading with these resources</h2>
            <p className="text-muted-foreground mb-6 max-w-3xl">
              Books frame the thinking; these references and posts apply it to a 2026 CNC shop.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { to: "/resources/pioneers", label: "Industrial & Manufacturing Pioneers" },
                { to: "/resources/lean", label: "Lean Manufacturing Toolkit" },
                { to: "/resources/5s", label: "5S Methodology" },
                { to: "/resources/quality", label: "Quality & Inspection Reference" },
                { to: "/resources/measuring-tools", label: "Measuring Tools Library" },
                { to: "/resources/gcode", label: "G-Code & M-Code Reference" },
                { to: "/blog/lessons-from-toyota-production-system", label: "Lessons from the Toyota Production System" },
                { to: "/blog/quality-lessons-from-deming-juran-shewhart-ishikawa", label: "Quality Lessons from Deming, Juran, Shewhart & Ishikawa" },
                { to: "/blog/throughput-lessons-goldratt-taylor-ford", label: "Throughput Lessons from Goldratt, Taylor & Ford" },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center justify-between gap-2 p-3 rounded-md border hover:border-primary/50 hover:bg-accent/30 transition-colors text-sm"
                >
                  <span>{l.label}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        </main>
        <MarketingFooter />
      </div>
    </>
  );
}
