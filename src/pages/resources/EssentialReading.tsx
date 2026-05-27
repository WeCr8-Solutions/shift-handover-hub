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

/**
 * Essential Reading — curated manufacturing book library.
 * Amazon /dp/ASIN URLs are clean (no affiliate tag) so they can be
 * swapped for an affiliate tag later via a single find-replace.
 */

type Role =
  | "Operator"
  | "Machinist / Programmer"
  | "Quality"
  | "Lean / CI"
  | "Supervisor"
  | "Manufacturing Engineer"
  | "Owner / Manager";

interface Book {
  title: string;
  author: string;
  asin: string;
  year?: string;
  why: string;
  roles: Role[];
  category: "Reference" | "CNC" | "Quality" | "Lean / TPS" | "Throughput" | "Leadership" | "History";
}

const BOOKS: Book[] = [
  // Reference
  {
    title: "Machinery's Handbook (32nd Edition)",
    author: "Erik Oberg et al. — Industrial Press",
    asin: "0831146311",
    year: "2020",
    why: "The single reference every machine shop should own. Threads, tap drills, materials, formulas, GD&T — used daily on the floor and in engineering.",
    roles: ["Machinist / Programmer", "Manufacturing Engineer", "Quality", "Supervisor"],
    category: "Reference",
  },
  {
    title: "Shop Reference for Students & Apprentices",
    author: "Edward G. Hoffman — Industrial Press",
    asin: "0831130792",
    why: "Pocket-sized companion to Machinery's Handbook. Perfect first reference for new operators and apprentices.",
    roles: ["Operator", "Machinist / Programmer"],
    category: "Reference",
  },
  // CNC
  {
    title: "CNC Programming Handbook (3rd Ed.)",
    author: "Peter Smid",
    asin: "0831133473",
    why: "The standard CNC programming text. Fanuc-flavored G/M-code, canned cycles, work offsets, macros — the book every programmer learns from.",
    roles: ["Machinist / Programmer", "Manufacturing Engineer"],
    category: "CNC",
  },
  {
    title: "The CNC Handbook (Kief / Roschiwal / Schwarz)",
    author: "Hans B. Kief et al.",
    asin: "083113636X",
    year: "2021",
    why: "Modern coverage from CNC fundamentals through Industry 4.0, automation, and digital manufacturing. Bridges shop-floor and engineering.",
    roles: ["Manufacturing Engineer", "Supervisor", "Owner / Manager"],
    category: "CNC",
  },
  {
    title: "CNC Beginner's Guide: CAD, CAM, and Machining",
    author: "Industrial Press",
    asin: "0831136960",
    year: "2025",
    why: "Plain-English path from CAD to chips. The right starting point for a new operator who wants to grow into programming.",
    roles: ["Operator"],
    category: "CNC",
  },
  // Quality
  {
    title: "Out of the Crisis",
    author: "W. Edwards Deming",
    asin: "0262541157",
    why: "The book that defines modern quality thinking. 94% of problems are the system, not the worker. Required reading for anyone who owns process.",
    roles: ["Quality", "Manufacturing Engineer", "Supervisor", "Owner / Manager"],
    category: "Quality",
  },
  {
    title: "Juran's Quality Handbook (7th Ed.)",
    author: "Joseph M. Juran & Joseph A. De Feo",
    asin: "1259643611",
    why: "The desk reference for quality engineers. COPQ, Pareto, planning, control, improvement — depth no blog post matches.",
    roles: ["Quality", "Manufacturing Engineer"],
    category: "Quality",
  },
  {
    title: "Guide to Quality Control",
    author: "Kaoru Ishikawa",
    asin: "9283310365",
    why: "The Seven Basic Quality Tools, including the fishbone diagram. Operator-friendly, supervisor-essential.",
    roles: ["Quality", "Supervisor", "Operator"],
    category: "Quality",
  },
  {
    title: "Economic Control of Quality of Manufactured Product",
    author: "Walter A. Shewhart",
    asin: "1614278113",
    why: "The origin of SPC and control charts. Common-cause vs. special-cause variation — still the framework every quality engineer uses.",
    roles: ["Quality", "Manufacturing Engineer"],
    category: "Quality",
  },
  // Lean / TPS
  {
    title: "Toyota Production System: Beyond Large-Scale Production",
    author: "Taiichi Ohno",
    asin: "0915299143",
    why: "Ohno in his own words. Stop-the-line, the seven wastes, pull systems — the source text for everything called 'lean' today.",
    roles: ["Lean / CI", "Supervisor", "Manufacturing Engineer", "Owner / Manager"],
    category: "Lean / TPS",
  },
  {
    title: "A Revolution in Manufacturing: The SMED System",
    author: "Shigeo Shingo",
    asin: "0915299038",
    why: "Single-Minute Exchange of Die. The book that turned setup reduction into a teachable discipline. Direct path to more throughput.",
    roles: ["Lean / CI", "Manufacturing Engineer", "Machinist / Programmer"],
    category: "Lean / TPS",
  },
  {
    title: "The Machine That Changed the World",
    author: "Womack, Jones & Roos",
    asin: "0060974176",
    why: "The MIT study that named 'lean production' and explained why Toyota outperformed Detroit. Essential context for any continuous-improvement effort.",
    roles: ["Lean / CI", "Owner / Manager", "Supervisor"],
    category: "Lean / TPS",
  },
  {
    title: "The Toyota Way (2nd Ed.)",
    author: "Jeffrey K. Liker",
    asin: "1260468518",
    why: "The 14 principles, made readable for Western managers. The most assigned book in lean training programs.",
    roles: ["Lean / CI", "Supervisor", "Owner / Manager"],
    category: "Lean / TPS",
  },
  {
    title: "Gemba Kaizen (2nd Ed.)",
    author: "Masaaki Imai",
    asin: "0071790357",
    why: "Improvement happens at the gemba — the place where work is done. The shortest path from 'we should be lean' to 'we walk the floor every day.'",
    roles: ["Supervisor", "Lean / CI", "Owner / Manager"],
    category: "Lean / TPS",
  },
  // Throughput
  {
    title: "The Goal",
    author: "Eliyahu M. Goldratt",
    asin: "0884271951",
    why: "Theory of Constraints as a novel. Read in a weekend, applied for a career. Changes how supervisors and owners think about bottlenecks.",
    roles: ["Supervisor", "Owner / Manager", "Manufacturing Engineer", "Lean / CI"],
    category: "Throughput",
  },
  {
    title: "Factory Physics (3rd Ed.)",
    author: "Hopp & Spearman",
    asin: "1577667395",
    why: "The math behind WIP, cycle time, and throughput. If The Goal is the story, Factory Physics is the engineering.",
    roles: ["Manufacturing Engineer", "Owner / Manager"],
    category: "Throughput",
  },
  // Leadership / History
  {
    title: "The Principles of Scientific Management",
    author: "Frederick W. Taylor",
    asin: "0486299880",
    why: "The original. You can't argue with — or against — modern manufacturing without reading the document that started industrial engineering.",
    roles: ["Manufacturing Engineer", "Supervisor", "Owner / Manager"],
    category: "History",
  },
  {
    title: "My Life and Work",
    author: "Henry Ford",
    asin: "1162577940",
    why: "Ford in 1922 — flow beats utilization, wages drive demand, vertical integration. The roots of mass production in his own voice.",
    roles: ["Owner / Manager", "Manufacturing Engineer"],
    category: "History",
  },
  {
    title: "The Lean Six Sigma Pocket Toolbook",
    author: "Michael L. George et al.",
    asin: "0071441190",
    why: "The pocket reference for everyday improvement tools — 5S, A3, fishbone, value stream maps. Cheap, durable, used.",
    roles: ["Lean / CI", "Supervisor", "Quality"],
    category: "Lean / TPS",
  },
];

const ROLES: Role[] = [
  "Operator",
  "Machinist / Programmer",
  "Quality",
  "Lean / CI",
  "Supervisor",
  "Manufacturing Engineer",
  "Owner / Manager",
];

const ROLE_BLURBS: Record<Role, string> = {
  Operator: "Start with a pocket reference and one CNC primer. Build the habit of looking things up.",
  "Machinist / Programmer": "Master the standard programming text, then anchor every shift with Machinery's Handbook on the bench.",
  Quality: "Deming and Juran are non-negotiable. Add Shewhart and Ishikawa to teach the floor common-cause vs. special-cause.",
  "Lean / CI": "Read the source (Ohno, Shingo) before the secondary literature. Then Womack and Liker for the management vocabulary.",
  Supervisor: "Goldratt and Imai are the two highest-leverage books a supervisor can read this quarter.",
  "Manufacturing Engineer": "Factory Physics for the math, Juran for quality, Ohno/Shingo for the philosophy that ties it together.",
  "Owner / Manager": "The Goal, The Machine That Changed the World, and Out of the Crisis — three books that pay back every hour invested.",
};

function amazonUrl(asin: string) {
  // Clean /dp/ASIN — swap for affiliate tag later (e.g. ?tag=joblineai-20).
  return `https://www.amazon.com/dp/${asin}`;
}

function BookCard({ book }: { book: Book }) {
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
            href={amazonUrl(book.asin)}
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
  const [activeRole, setActiveRole] = useState<Role | "All">("All");

  const visible = useMemo(() => {
    if (activeRole === "All") return BOOKS;
    return BOOKS.filter((b) => b.roles.includes(activeRole));
  }, [activeRole]);

  const itemList = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Essential Manufacturing Reading List",
      itemListElement: BOOKS.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Book",
          name: b.title,
          author: b.author,
          url: amazonUrl(b.asin),
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

          {/* Role tabs */}
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
                All ({BOOKS.length})
              </Button>
              {ROLES.map((role) => {
                const count = BOOKS.filter((b) => b.roles.includes(role)).length;
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

          {/* Related resources */}
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
