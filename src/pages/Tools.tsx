import { useState, useMemo, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { HandbookCite } from "@/components/handbook/HandbookCite";
import { HandbookLinkInlineEditor } from "@/components/handbook/HandbookLinkInlineEditor";
import { useAdminAccess } from "@/hooks/useAdminData";
import { TOOL_REGISTRY, TOOL_CATEGORIES } from "@/components/tools";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Search, Wrench, Loader2, ArrowLeft, BookOpen, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const categoryColors: Record<string, string> = {
  machining: "bg-primary/10 text-primary border-primary/30",
  measurement: "bg-accent/10 text-accent-foreground border-accent/30",
  conversion: "bg-secondary text-secondary-foreground border-secondary",
  reference: "bg-muted text-muted-foreground border-muted",
};

export default function Tools() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { hasPlatformAccess } = useAdminAccess();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return TOOL_REGISTRY.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q))
      );
    });
  }, [search, category]);

  const activeToolDef = TOOL_REGISTRY.find((t) => t.id === activeTool);
  const ActiveComponent = activeToolDef?.component ?? null;

  return (
    <>
      <SEOHead
        title="Operator Tools | JobLine"
        description="Free machining calculators and manufacturing tools — SFM calculator, tolerance stackup, unit converter, and more."
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-2 rounded-lg bg-primary/10">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Operator Tools</h1>
              <p className="text-sm text-muted-foreground">
                Calculators and references for the shop floor
              </p>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools..."
                className="pl-9"
              />
            </div>
            <Tabs value={category} onValueChange={setCategory}>
              <TabsList>
                {TOOL_CATEGORIES.map((c) => (
                  <TabsTrigger key={c.value} value={c.value} className="text-xs">
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                    <BookOpen className="w-4 h-4" />
                    Machinist's Reference Library
                  </div>
                  <CardTitle className="text-xl">Digital handbook for shop-floor reference</CardTitle>
                  <CardDescription className="max-w-3xl text-sm">
                    Browse live handbook entries for threads, feeds and speeds, GD&amp;T, fits,
                    formulas, inspection, tooling, and safety standards. These references are also
                    reused throughout JobLine in OAP lessons and G-Code Academy question review.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
                  Live reference
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-background px-2.5 py-1 border">GD&amp;T</span>
                <span className="rounded-full bg-background px-2.5 py-1 border">Threads</span>
                <span className="rounded-full bg-background px-2.5 py-1 border">Tooling</span>
                <span className="rounded-full bg-background px-2.5 py-1 border">Inspection</span>
                <span className="rounded-full bg-background px-2.5 py-1 border">Formulas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => navigate("/handbook")} className="gap-2">
                  Open handbook <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tool Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((tool) => {
              const available = !!tool.component;
              return (
                <Card
                  key={tool.id}
                  className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/40 ${
                    !available ? "opacity-60" : ""
                  }`}
                  onClick={() => available && setActiveTool(tool.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-md bg-muted">{tool.icon}</div>
                      <Badge variant="outline" className={`text-[10px] ${categoryColors[tool.category] || ""}`}>
                        {tool.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm mt-2">{tool.name}</CardTitle>
                    <CardDescription className="text-xs">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {!available && (
                      <Badge variant="secondary" className="text-[9px]">Coming Soon</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Wrench className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No tools match your search.</p>
            </div>
          )}

          <AdPlacement format="rectangle" slot="tools-bottom" className="mt-10" />
        </main>
      </div>

      {/* Tool Sheet — slides from right, full height for large tools */}
      <Sheet open={!!activeTool} onOpenChange={() => setActiveTool(null)}>
        <SheetContent
          side="right"
          className={`overflow-y-auto ${isMobile ? "w-full sm:max-w-full" : "sm:max-w-2xl"}`}
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              {activeToolDef?.icon}
              {activeToolDef?.name}
            </SheetTitle>
            {activeToolDef && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{activeToolDef.description}</p>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs font-medium text-primary">Handbook-backed reference</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This tool is paired with handbook entries so operators, programmers, and machinists
                    can move from a calculator or chart to the underlying shop-floor reference without
                    leaving JobLine.
                  </p>
                </div>
              </div>
            )}
          </SheetHeader>
          <div className="mt-4">
            {activeToolDef && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Source references
                </p>
                <HandbookCite entityType="operator_tool" entityId={activeToolDef.id} variant="card" />
                {hasPlatformAccess && (
                  <HandbookLinkInlineEditor
                    entityType="operator_tool"
                    entityIdOrKey={activeToolDef.id}
                    title="Manage handbook links (admin)"
                  />
                )}
              </div>
            )}
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}>
              {ActiveComponent && <ActiveComponent />}
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
