import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ChevronDown, Search, Play, BookOpen } from "lucide-react";
import { useInspectionTools, type InspectionTool } from "@/hooks/useInspectionTools";
import { TrainingMedia } from "@/components/training/TrainingMedia";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

/**
 * Public learner-facing inspection tool reference.
 * Lists every canonical tool grouped by category and renders attached
 * YouTube tutorials + reference diagrams via <TrainingMedia/>.
 *
 * Read-only: no testing happens here. Tests live at /oap/proficiency.
 */
export default function MeasuringTools() {
  const { categories, tools, loading } = useInspectionTools({ includeHidden: false });
  const [q, setQ] = useState("");

  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? tools.filter(
          (t) =>
            t.name.toLowerCase().includes(needle) ||
            (t.description ?? "").toLowerCase().includes(needle) ||
            (t.typical_use ?? "").toLowerCase().includes(needle),
        )
      : tools;
    const map = new Map<string, InspectionTool[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.category_id) ?? [];
      arr.push(t);
      map.set(t.category_id, arr);
    });
    return categories
      .map((c) => ({ category: c, items: map.get(c.id) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [categories, tools, q]);

  return (
    <>
      <MarketingNav />
      <Helmet>
        <title>Measuring Tools Library — Videos & Diagrams | Jobline.ai</title>
        <meta
          name="description"
          content="Free reference library for CNC operators: how to read calipers, micrometers, indicators, height gauges, CMMs and more. Tap any tool for video tutorials and diagrams."
        />
        <link rel="canonical" href="https://jobline.ai/resources/measuring-tools" />
      </Helmet>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <header className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3">Free Learner Reference</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Measuring Tools Library</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tap any tool to expand its video tutorial, diagram, and usage notes.
            Practice here, then prove proficiency in the{" "}
            <Link to="/oap/proficiency" className="underline text-primary">
              measurement test center
            </Link>.
          </p>
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search calipers, micrometers, CMM, indicators..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            aria-label="Search measuring tools"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No tools match "{q}".
          </p>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ category, items }) => (
              <section key={category.id}>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" aria-hidden />
                  {category.name}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({items.length})
                  </span>
                </h2>
                <div className="grid gap-3">
                  {items.map((tool) => (
                    <ToolRow key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <section className="mt-12 p-6 rounded-lg border bg-muted/30 text-center">
          <h2 className="text-lg font-semibold mb-2">Ready to certify your skills?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Take a mentor-graded measurement proficiency test and earn a printable record.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button asChild>
              <Link to="/oap/proficiency">Take a Proficiency Test</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/resources/oap">Learn about OAP</Link>
            </Button>
          </div>
        </section>
      </div>
      <MarketingFooter />
    </>
  );
}

function ToolRow({ tool }: { tool: InspectionTool }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={open ? "border-primary/50" : undefined}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors rounded-md"
            aria-expanded={open}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{tool.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {tool.difficulty}
                </Badge>
                {tool.precision_spec && (
                  <Badge variant="outline" className="text-[10px]">
                    {tool.precision_spec}
                  </Badge>
                )}
              </div>
              {tool.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {tool.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-primary shrink-0">
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">Watch</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-3 border-t">
            {tool.typical_use && (
              <p className="text-xs">
                <strong>Typical use:</strong> {tool.typical_use}
              </p>
            )}
            <TrainingMedia
              entityType="inspection_tool"
              entityId={tool.id}
              emptyHint="Tutorial videos coming soon for this tool."
            />
            {tool.safety_notes && (
              <p className="text-[11px] text-destructive border-l-2 border-destructive pl-2">
                <strong>Safety:</strong> {tool.safety_notes}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="sm" variant="outline">
                <Link to={`/oap/proficiency?tool=${encodeURIComponent(tool.slug)}`}>
                  Test my skill on this tool
                </Link>
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
