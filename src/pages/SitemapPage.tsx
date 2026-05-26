import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

// Raw-load the sitemap at build time so the page reflects whatever
// public/sitemap.xml currently advertises — no drift, no DB call.
import sitemapXml from "../../public/sitemap.xml?raw";

interface Entry {
  path: string;
  label: string;
}

const SECTION_ORDER: { key: string; title: string; match: (p: string) => boolean }[] = [
  { key: "core", title: "Product", match: (p) => /^\/(pricing|demo|tools|shift-handoff|machine-time-tracking|manufacturing-visibility|use-cases)?$/.test(p) },
  { key: "features", title: "Features", match: (p) => p.startsWith("/features") },
  { key: "industries", title: "Industries", match: (p) => p.startsWith("/industries") },
  { key: "compare", title: "Alternatives & Comparisons", match: (p) => p.startsWith("/compare") },
  { key: "talent", title: "Talent Network", match: (p) => p.startsWith("/talent") },
  { key: "oap", title: "OAP & GCA", match: (p) => p.startsWith("/oap") || p.startsWith("/gca") || p.startsWith("/gcode-academy") },
  { key: "blog", title: "Blog", match: (p) => p.startsWith("/blog") },
  { key: "resources", title: "Resources", match: (p) => p.startsWith("/resources") },
  { key: "handbook", title: "Machinist Handbook", match: (p) => p.startsWith("/handbook") },
  { key: "help", title: "Help Center", match: (p) => p.startsWith("/help") },
  { key: "learn", title: "Learn", match: (p) => p.startsWith("/learn") },
  { key: "manuals", title: "Manuals & Library", match: (p) => p.startsWith("/manuals") },
  { key: "verify", title: "Certificate Verification", match: (p) => p.startsWith("/verify") },
  { key: "legal", title: "Legal", match: (p) => /^\/(terms|privacy|cookies)/.test(p) },
];

function humanize(path: string): string {
  if (path === "/") return "Home";
  const tail = path.split("/").filter(Boolean).pop() || path;
  return tail.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseEntries(): Entry[] {
  const re = /<loc>\s*https?:\/\/[^/]+([^<]*)<\/loc>/g;
  const seen = new Set<string>();
  const out: Entry[] = [];
  for (const m of sitemapXml.matchAll(re)) {
    const raw = (m[1] || "").trim();
    if (!raw || raw.endsWith(".xml")) continue;
    const path = raw === "/" ? "/" : raw.replace(/\/$/, "");
    if (seen.has(path)) continue;
    seen.add(path);
    out.push({ path, label: humanize(path) });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function bucketize(entries: Entry[]) {
  const buckets: Record<string, Entry[]> = {};
  const other: Entry[] = [];
  for (const e of entries) {
    const section = SECTION_ORDER.find((s) => s.match(e.path));
    if (section) (buckets[section.key] ||= []).push(e);
    else other.push(e);
  }
  return { buckets, other };
}

export default function SitemapPage() {
  const entries = parseEntries();
  const { buckets, other } = bucketize(entries);

  return (
    <>
      <SEOHead
        title="Site Map — Every Public Page on JobLine.ai"
        description="Human-readable index of every public page on JobLine.ai: features, industries, blog, handbook, help center, OAP, G-Code Academy, talent network, and more."
        canonical="/sitemap"
      />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <header className="mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-3">Site Map</h1>
            <p className="text-muted-foreground max-w-2xl">
              Every public page on JobLine.ai, grouped by section. {entries.length} URLs in total.
              For machine-readable indexing, see{" "}
              <a href="/sitemap-index.xml" className="text-primary underline">sitemap-index.xml</a>.
            </p>
          </header>

          {SECTION_ORDER.map((section) => {
            const items = buckets[section.key];
            if (!items?.length) return null;
            return (
              <section key={section.key} className="mb-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
                  {section.title}{" "}
                  <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                  {items.map((e) => (
                    <li key={e.path}>
                      <Link to={e.path} className="text-sm text-foreground hover:text-primary hover:underline">
                        {e.label}
                      </Link>
                      <div className="text-xs text-muted-foreground font-mono truncate">{e.path}</div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {other.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
                Other <span className="text-sm font-normal text-muted-foreground">({other.length})</span>
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                {other.map((e) => (
                  <li key={e.path}>
                    <Link to={e.path} className="text-sm text-foreground hover:text-primary hover:underline">
                      {e.label}
                    </Link>
                    <div className="text-xs text-muted-foreground font-mono truncate">{e.path}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <MarketingFooter />
      </main>
    </>
  );
}
