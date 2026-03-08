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
import { TOOL_REGISTRY, TOOL_CATEGORIES } from "@/components/tools";
import { Search, Wrench, Loader2, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const categoryColors: Record<string, string> = {
  machining: "bg-primary/10 text-primary border-primary/30",
  measurement: "bg-accent/10 text-accent-foreground border-accent/30",
  conversion: "bg-secondary text-secondary-foreground border-secondary",
  reference: "bg-muted text-muted-foreground border-muted",
};

export default function Tools() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const isMobile = useIsMobile();

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
              <p className="text-xs text-muted-foreground">{activeToolDef.description}</p>
            )}
          </SheetHeader>
          <div className="mt-4">
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}>
              {ActiveComponent && <ActiveComponent />}
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
