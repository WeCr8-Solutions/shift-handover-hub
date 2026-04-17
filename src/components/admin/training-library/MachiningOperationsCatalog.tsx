import { useMemo, useState } from "react";
import { useMachiningOperations, type MachiningOperation } from "@/hooks/useMachiningOperations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrainingMedia } from "@/components/training/TrainingMedia";
import { TrainingMediaUploader } from "@/components/training/TrainingMediaUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImagePlus, Search } from "lucide-react";

interface Props {
  isPlatformAdmin: boolean;
}

const PROFESSIONS = [
  "machinist","programmer","toolmaker","grinder","edm","gear-cutter",
  "finisher","assembler","waterjet-op","laser-op","additive",
];
const MACHINES = [
  "vmc","hmc","5-axis","lathe","swiss","mill-turn","live-tool-lathe",
  "surface-grinder","cylindrical-grinder","id-grinder","centerless-grinder",
  "jig-grinder","wire-edm","ram-edm","hole-popper","hobbing-machine",
  "gear-shaper","broach","waterjet","fiber-laser","co2-laser","dmls","slm","gun-drill",
];

export function MachiningOperationsCatalog({ isPlatformAdmin }: Props) {
  const { categories, operations, isLoading } = useMachiningOperations();
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState<string>("all");
  const [profession, setProfession] = useState<string>("all");
  const [machine, setMachine] = useState<string>("all");

  const filtered = useMemo(() => {
    return operations.filter((o) => {
      if (categorySlug !== "all") {
        const cat = categories.find((c) => c.id === o.category_id);
        if (cat?.slug !== categorySlug) return false;
      }
      if (profession !== "all" && !o.profession_tags.includes(profession)) return false;
      if (machine !== "all" && !o.machine_tags.includes(machine)) return false;
      if (
        query &&
        !`${o.name} ${o.short_description ?? ""} ${o.typical_tooling.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [operations, categories, categorySlug, profession, machine, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, MachiningOperation[]>();
    filtered.forEach((o) => {
      const arr = map.get(o.category_id) ?? [];
      arr.push(o);
      map.set(o.category_id, arr);
    });
    return Array.from(map.entries())
      .map(([catId, items]) => ({ category: categories.find((c) => c.id === catId), items }))
      .filter((g) => g.category)
      .sort((a, b) => (a.category?.sort_order ?? 0) - (b.category?.sort_order ?? 0));
  }, [filtered, categories]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Machining Operations Catalog</CardTitle>
          <p className="text-xs text-muted-foreground">
            {operations.length} operations across {categories.length} categories.
            Click any operation to view or attach AVIF/GIF/JPEG/PNG/MP3/MP4 training media.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search operations…"
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
                {PROFESSIONS.map((p) => (
                  <SelectItem key={p} value={p}>{p.replace(/-/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={machine} onValueChange={setMachine}>
              <SelectTrigger><SelectValue placeholder="Machine" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All machines</SelectItem>
                {MACHINES.map((m) => (
                  <SelectItem key={m} value={m}>{m.replace(/-/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
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
              {items.map((o) => (
                <Dialog key={o.id}>
                  <DialogTrigger asChild>
                    <button className="text-left rounded-md border p-2 hover:bg-accent transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{o.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {o.short_description}
                          </p>
                        </div>
                        {o.difficulty && (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {o.difficulty}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {o.machine_tags.slice(0, 3).map((m) => (
                          <Badge key={m} variant="outline" className="text-[10px]">
                            {m.replace(/-/g, " ")}
                          </Badge>
                        ))}
                        {o.profession_tags.slice(0, 2).map((p) => (
                          <Badge key={p} variant="outline" className="text-[10px]">
                            {p.replace(/-/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {o.name}
                        {o.difficulty && <Badge variant="secondary">{o.difficulty}</Badge>}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      {o.short_description && <p>{o.short_description}</p>}
                      {o.long_description && (
                        <p className="text-muted-foreground">{o.long_description}</p>
                      )}
                      {o.typical_tooling?.length ? (
                        <p className="text-xs text-muted-foreground">
                          <strong>Typical tooling:</strong> {o.typical_tooling.join(", ")}
                        </p>
                      ) : null}
                      {o.common_pitfalls && (
                        <p className="text-xs">
                          <strong>Common pitfalls:</strong> {o.common_pitfalls}
                        </p>
                      )}
                      {o.safety_notes && (
                        <p className="text-xs text-destructive">
                          <strong>Safety:</strong> {o.safety_notes}
                        </p>
                      )}

                      <div className="border-t pt-3">
                        <h4 className="text-sm font-semibold mb-2">Training media</h4>
                        <TrainingMedia
                          entityType="machining_operation"
                          entityId={o.id}
                          emptyHint="No media uploaded yet."
                        />
                      </div>
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <ImagePlus className="w-4 h-4" /> Upload new
                        </h4>
                        <TrainingMediaUploader
                          entityType="machining_operation"
                          entityId={o.id}
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
