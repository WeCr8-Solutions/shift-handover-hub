import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useHandbookCategories, useHandbookReferences } from "@/hooks/useHandbook";

export default function HandbookLibrary() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const cats = useHandbookCategories();
  const refs = useHandbookReferences({
    search: search || undefined,
    categorySlug: activeCat === "all" ? undefined : activeCat,
  });

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

      <Tabs value={activeCat} onValueChange={setActiveCat}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {cats.data?.map((c) => (
            <TabsTrigger key={c.id} value={c.slug}>{c.name}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCat} className="mt-6">
          {refs.isLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : refs.data?.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No references found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {refs.data?.map((r) => (
                <Link key={r.id} to={`/handbook/${r.slug}`}>
                  <Card className="h-full hover:border-primary/60 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{r.title}</CardTitle>
                        {r.difficulty && (
                          <Badge variant="outline" className="text-xs capitalize">{r.difficulty}</Badge>
                        )}
                      </div>
                      {r.category?.name && (
                        <p className="text-xs text-muted-foreground">{r.category.name}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {r.summary && <p className="text-sm text-muted-foreground">{r.summary}</p>}
                      {r.formula && (
                        <code className="block text-xs bg-muted px-2 py-1 rounded">{r.formula}</code>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {r.tags.slice(0, 4).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
