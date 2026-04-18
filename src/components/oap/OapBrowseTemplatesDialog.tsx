import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCanonicalRolePrograms,
  useCloneRoleProgramTemplate,
} from "@/hooks/useOapProgram";
import { Library, Search, Plus, Sparkles } from "lucide-react";

interface Props {
  trigger?: React.ReactNode;
}

/**
 * Lets an org admin browse canonical OAP role-program templates seeded
 * by the platform and clone them into their own organization.
 */
export function OapBrowseTemplatesDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [vertical, setVertical] = useState<string>("all");
  const { data: templates = [], isLoading } = useCanonicalRolePrograms();
  const clone = useCloneRoleProgramTemplate();

  const verticals = useMemo(
    () =>
      Array.from(new Set(templates.map((t) => t.vertical ?? "machining"))).sort(),
    [templates],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (vertical !== "all" && (t.vertical ?? "machining") !== vertical) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.vertical_role_slug ?? "").toLowerCase().includes(q)
      );
    });
  }, [templates, query, vertical]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Library className="w-4 h-4 mr-1" /> Browse preset programs
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Preset profession-based programs
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Pick a template seeded by JobLine.ai for any of {verticals.length} trade verticals.
            Clone it into your shop in one click — you can rename, edit courses, or
            tweak required machines after.
          </p>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search role, vertical, or duty…"
              className="pl-8"
            />
          </div>
          <select
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label="Filter by vertical"
          >
            <option value="all">All verticals</option>
            {verticals.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <ScrollArea className="h-[480px] -mr-3 pr-3">
          <div className="space-y-2">
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading templates…</p>
            )}
            {!isLoading && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-8 text-center">
                No templates match your search.
              </p>
            )}
            {filtered.map((t) => (
              <Card key={t.id} className="hover:border-primary/50 transition">
                <CardContent className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {t.vertical ?? "machining"}
                      </Badge>
                      <p className="font-medium text-sm">{t.name}</p>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      clone.mutate(
                        { template_id: t.id },
                        {
                          onSuccess: () => {
                            // Keep dialog open so admin can clone several
                          },
                        },
                      )
                    }
                    disabled={clone.isPending}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add to shop
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
