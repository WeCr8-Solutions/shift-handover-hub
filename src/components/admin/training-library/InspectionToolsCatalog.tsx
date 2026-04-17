import { useMemo, useState } from "react";
import { useInspectionTools, type InspectionTool } from "@/hooks/useInspectionTools";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrainingMedia } from "@/components/training/TrainingMedia";
import { TrainingMediaUploader } from "@/components/training/TrainingMediaUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImagePlus, Search } from "lucide-react";

interface Props {
  isPlatformAdmin: boolean;
}

export function InspectionToolsCatalog({ isPlatformAdmin }: Props) {
  const { categories, allTools: tools, loading } = useInspectionTools({
    includeHidden: true,
  });
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState<string>("all");
  const [profession, setProfession] = useState<string>("all");
  const [activeTool, setActiveTool] = useState<InspectionTool | null>(null);

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (categorySlug !== "all") {
        const cat = categories.find((c) => c.id === t.category_id);
        if (cat?.slug !== categorySlug) return false;
      }
      if (profession !== "all" && !t.profession_tags.includes(profession as never))
        return false;
      if (
        query &&
        !`${t.name} ${t.description ?? ""} ${t.precision_spec ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [tools, categories, categorySlug, profession, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, InspectionTool[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.category_id) ?? [];
      arr.push(t);
      map.set(t.category_id, arr);
    });
    return Array.from(map.entries())
      .map(([catId, items]) => ({
        category: categories.find((c) => c.id === catId),
        items,
      }))
      .filter((g) => g.category)
      .sort(
        (a, b) =>
          (a.category?.sort_order ?? 0) - (b.category?.sort_order ?? 0)
      );
  }, [filtered, categories]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inspection Tool Catalog</CardTitle>
          <p className="text-xs text-muted-foreground">
            {tools.length} tools across {categories.length} categories. Click any
            tool to view or upload AVIF/GIF/JPEG/PNG/MP3/MP4 training media.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search tools…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger><SelectValue placeholder="Profession" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All professions</SelectItem>
                {[
                  "machinist","qc_inspector","welder","fabricator","assembler",
                  "op_lead","programmer","toolmaker","grinder","edm_operator",
                  "cmm_operator","maintenance",
                ].map((p) => (
                  <SelectItem key={p} value={p}>{p.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        grouped.map(({ category, items }) => (
          <Card key={category!.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{category!.name}</span>
                <Badge variant="outline">{items.length}</Badge>
              </CardTitle>
              {category!.description && (
                <p className="text-xs text-muted-foreground">{category!.description}</p>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {items.map((t) => (
                <Dialog key={t.id}>
                  <DialogTrigger asChild>
                    <button
                      onClick={() => setActiveTool(t)}
                      className="text-left rounded-md border p-2 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {t.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {t.difficulty}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {t.precision_spec && (
                          <Badge variant="outline" className="text-[10px]">
                            {t.precision_spec}
                          </Badge>
                        )}
                        {t.profession_tags.slice(0, 3).map((p) => (
                          <Badge key={p} variant="outline" className="text-[10px]">
                            {p.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {t.name}
                        <Badge variant="secondary">{t.difficulty}</Badge>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      {t.description && <p>{t.description}</p>}
                      {t.typical_use && (
                        <p className="text-muted-foreground">
                          <strong>Typical use:</strong> {t.typical_use}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {t.precision_spec && (
                          <div>
                            <strong>Precision:</strong> {t.precision_spec}
                          </div>
                        )}
                        {t.measurement_range && (
                          <div>
                            <strong>Range:</strong> {t.measurement_range}
                          </div>
                        )}
                      </div>
                      {t.manufacturer_examples?.length ? (
                        <p className="text-xs text-muted-foreground">
                          <strong>Manufacturers:</strong> {t.manufacturer_examples.join(", ")}
                        </p>
                      ) : null}

                      <div className="border-t pt-3">
                        <h4 className="text-sm font-semibold mb-2">Training media</h4>
                        <TrainingMedia
                          entityType="inspection_tool"
                          entityId={t.id}
                          emptyHint="No media uploaded yet."
                        />
                      </div>

                      <div className="border-t pt-3">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <ImagePlus className="w-4 h-4" /> Upload new
                        </h4>
                        <TrainingMediaUploader
                          entityType="inspection_tool"
                          entityId={t.id}
                          allowCanonical={isPlatformAdmin}
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
