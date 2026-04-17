import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, X, Tag } from "lucide-react";
import { useMachiningOperations } from "@/hooks/useMachiningOperations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TAG_FIELDS = [
  { key: "profession_tags", label: "Profession" },
  { key: "role_tags", label: "Role" },
  { key: "machine_tags", label: "Machine" },
] as const;

type TagField = (typeof TAG_FIELDS)[number]["key"];

interface Props {
  isPlatformAdmin: boolean;
}

/**
 * Platform-admin tool to bulk add/remove a tag across many canonical
 * machining operations at once.
 */
export function BulkTagPanel({ isPlatformAdmin }: Props) {
  const { operations, categories, isLoading } = useMachiningOperations();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagField, setTagField] = useState<TagField>("machine_tags");
  const [tagValue, setTagValue] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () =>
      operations.filter(
        (o) =>
          !query ||
          o.name.toLowerCase().includes(query.toLowerCase()) ||
          o.short_description?.toLowerCase().includes(query.toLowerCase())
      ),
    [operations, query]
  );

  if (!isPlatformAdmin) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground text-center">
          Bulk tag editing is available to platform admins only.
        </CardContent>
      </Card>
    );
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected(new Set(filtered.map((f) => f.id)));
  };

  const apply = async (mode: "add" | "remove") => {
    if (!tagValue.trim() || selected.size === 0) {
      toast.error("Pick a tag value and at least one operation");
      return;
    }
    setBusy(true);
    const tag = tagValue.trim().toLowerCase();
    let updated = 0;
    for (const op of operations.filter((o) => selected.has(o.id))) {
      const current = (op[tagField] as string[]) ?? [];
      const next =
        mode === "add"
          ? Array.from(new Set([...current, tag]))
          : current.filter((t) => t !== tag);
      const { error } = await supabase
        .from("machining_operations")
        .update({ [tagField]: next })
        .eq("id", op.id);
      if (!error) updated++;
    }
    setBusy(false);
    toast.success(`${updated} operations updated`);
    setSelected(new Set());
    setTagValue("");
    // Force refetch by reload — simplest, since hook uses react-query keys
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="w-4 h-4" /> Bulk Tag Editor
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Apply a profession, role, or machine tag to many canonical operations
          at once.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search operations…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={tagField} onValueChange={(v) => setTagField(v as TagField)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAG_FIELDS.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="tag value (e.g. 5-axis)"
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={selectAllVisible}>
            Select all visible ({filtered.length})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
          <Badge variant="secondary">{selected.size} selected</Badge>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="default"
              disabled={busy || !selected.size || !tagValue}
              onClick={() => apply("add")}
            >
              <Plus className="w-3 h-3 mr-1" /> Add tag
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy || !selected.size || !tagValue}
              onClick={() => apply("remove")}
            >
              <X className="w-3 h-3 mr-1" /> Remove tag
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="border rounded-md divide-y max-h-[55vh] overflow-y-auto">
            {filtered.map((op) => {
              const cat = categories.find((c) => c.id === op.category_id);
              const tags = (op[tagField] as string[]) ?? [];
              return (
                <label
                  key={op.id}
                  className="flex items-start gap-3 p-2.5 cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    checked={selected.has(op.id)}
                    onCheckedChange={() => toggle(op.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{op.name}</p>
                      {cat && (
                        <Badge variant="outline" className="text-[10px]">
                          {cat.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tags.length === 0 && (
                        <span className="text-[10px] text-muted-foreground italic">
                          no {tagField.replace("_tags", "")} tags
                        </span>
                      )}
                      {tags.map((t) => (
                        <Badge
                          key={t}
                          variant={t === tagValue.toLowerCase() ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
