import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useHandbookCategories, useHandbookReferences } from "@/hooks/useHandbook";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { SEOHead } from "@/components/SEOHead";

const HANDBOOK_SEARCH_KEY = "handbook-library-search";
const HANDBOOK_CATEGORY_KEY = "handbook-library-category";

function readStoredValue(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) || fallback;
}

export default function HandbookLibrary() {
  const [search, setSearch] = useState(() => readStoredValue(HANDBOOK_SEARCH_KEY, ""));
  const [activeCat, setActiveCat] = useState<string>(() => readStoredValue(HANDBOOK_CATEGORY_KEY, "all"));
  const cats = useHandbookCategories();
  const refs = useHandbookReferences({
    search: search || undefined,
    categorySlug: activeCat === "all" ? undefined : activeCat,
  });
  const references = refs.data ?? [];
  const showLoadingGrid = refs.isLoading && references.length === 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HANDBOOK_SEARCH_KEY, search);
  }, [search]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HANDBOOK_CATEGORY_KEY, activeCat);
  }, [activeCat]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Machinist's Reference</h1>
        </div>
        <p className="text-muted-foreground">
          Handbook-style reference material — feeds & speeds, threads, fits, GD&T, formulas, safety standards.
        </p>
        <p className="text-sm text-muted-foreground">
          Search and category filters persist on this device so the handbook stays where you left it.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search references..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <AdPlacement format="horizontal" slot="handbook-top" className="my-2" />


      <Tabs value={activeCat} onValueChange={setActiveCat}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {cats.data?.map((c) => (
            <TabsTrigger key={c.id} value={c.slug}>{c.name}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCat} className="mt-6">
          {refs.isFetching && references.length > 0 ? (
            <p className="mb-3 text-xs text-muted-foreground">Refreshing handbook references...</p>
          ) : null}

          {showLoadingGrid ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : references.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No references found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {references.map((r) => (
                <Link key={r.id} to={`/handbook/${r.slug}`}>
                  <Card className="h-full hover:border-primary/60 hover:bg-muted/30 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{r.title}</CardTitle>
                        {r.difficulty && (
                          <Badge variant="outline" className="text-xs capitalize">{r.difficulty}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {r.category?.name ? <span>{r.category.name}</span> : null}
                        {r.is_canonical ? <Badge variant="secondary" className="text-[10px]">Canonical</Badge> : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {r.summary && <p className="text-sm text-muted-foreground">{r.summary}</p>}
                      {r.formula && (
                        <code className="block text-xs bg-muted px-2 py-1 rounded">{r.formula}</code>
                      )}
                      {r.units && (
                        <p className="text-[11px] text-muted-foreground">Units: {r.units}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {r.tags.slice(0, 4).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Open reference</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AdPlacement format="rectangle" slot="handbook-bottom" className="my-4" />
    </div>
  );
}
