import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useHandbookReferences,
  useHandbookLinksFor,
  type HandbookEntityType,
  type HandbookReference,
} from "@/hooks/useHandbook";
import { HandbookCreateReferenceDialog } from "./HandbookCreateReferenceDialog";
import { BookOpen, ExternalLink, Trash2, ArrowUp, ArrowDown, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
  entityType: HandbookEntityType;
  /** UUID for content rows, or string key for entities like operator_tool. */
  entityIdOrKey: string | undefined;
  readOnly?: boolean;
  /** Compact = no big header card, suitable for inline placement inside an editor. */
  compact?: boolean;
  title?: string;
}

interface LinkRow {
  id: string;
  reference_id: string;
  sort_order: number;
  reference: { id: string; title: string; slug: string; category: { name: string | null } | null } | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Inline handbook reference editor used inside GCA bank, GCA question,
 * OAP course/lesson/quiz-question, and operator-tool admin surfaces.
 *
 * Authors get: list, search-and-add, reorder, remove, "open in handbook",
 * and a fallback "create new stub" affordance when a topic doesn't exist.
 */
export function HandbookLinkInlineEditor({
  entityType,
  entityIdOrKey,
  readOnly,
  compact,
  title = "Handbook references",
}: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const isUuid = !!entityIdOrKey && UUID_RE.test(entityIdOrKey);
  // We only mutate links when there's a real anchor — UUID for content rows,
  // free key for operator_tool. Mismatched cases render a hint, not silent fail.
  const canManage = !readOnly && !!entityIdOrKey;

  // Reuse the public read hook for the actual list (handles fallbacks too).
  const linked = useHandbookLinksFor(entityType, entityIdOrKey);

  // Companion query for the editable rows (we need link.id + sort_order).
  const linkRows = useQuery({
    queryKey: ["handbook_links_inline", entityType, entityIdOrKey],
    enabled: !!entityIdOrKey,
    queryFn: async (): Promise<LinkRow[]> => {
      if (!entityIdOrKey) return [];
      let q = supabase
        .from("handbook_links")
        .select(
          "id, reference_id, sort_order, reference:handbook_references(id, title, slug, category:handbook_categories(name))"
        )
        .eq("entity_type", entityType)
        .order("sort_order", { ascending: true });
      q = isUuid ? q.eq("entity_id", entityIdOrKey) : q.eq("entity_key", entityIdOrKey);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LinkRow[];
    },
  });

  const linkedIds = useMemo(
    () => new Set((linkRows.data ?? []).map((r) => r.reference_id)),
    [linkRows.data]
  );

  const { data: refSearchResults = [] } = useHandbookReferences(
    search.trim().length >= 2 ? { search: search.trim() } : undefined
  );

  const filteredResults = useMemo(
    () => refSearchResults.filter((r) => !linkedIds.has(r.id)).slice(0, 8),
    [refSearchResults, linkedIds]
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["handbook_links_inline", entityType, entityIdOrKey] });
    qc.invalidateQueries({ queryKey: ["handbook_links", entityType, entityIdOrKey] });
  };

  const addLink = useMutation({
    mutationFn: async (referenceId: string) => {
      if (!entityIdOrKey) throw new Error("Save the entity first.");
      const payload: {
        entity_type: HandbookEntityType;
        reference_id: string;
        sort_order: number;
        entity_id?: string;
        entity_key?: string;
      } = {
        entity_type: entityType,
        reference_id: referenceId,
        sort_order: linkRows.data?.length ?? 0,
      };
      if (isUuid) payload.entity_id = entityIdOrKey;
      else payload.entity_key = entityIdOrKey;
      const { error } = await supabase.from("handbook_links").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reference linked");
      setSearch("");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to link"),
  });

  const removeLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("handbook_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link removed");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to remove"),
  });

  const reorder = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("handbook_links")
        .update({ sort_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const moveRow = (idx: number, dir: -1 | 1) => {
    const rows = linkRows.data ?? [];
    const target = idx + dir;
    if (target < 0 || target >= rows.length) return;
    const a = rows[idx];
    const b = rows[target];
    reorder.mutate({ id: a.id, newOrder: b.sort_order });
    reorder.mutate({ id: b.id, newOrder: a.sort_order });
  };

  // The list to display (DB rows when present, fallback hook for empty state).
  const displayRows = linkRows.data ?? [];
  const fallbackOnly = displayRows.length === 0 && (linked.data?.length ?? 0) > 0;

  const Wrapper = compact ? "div" : "div";

  return (
    <Wrapper className={compact ? "space-y-2" : "rounded-md border bg-muted/20 p-3 space-y-2"}>
      {!compact && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          {title}
          <Badge variant="outline" className="text-[10px] h-4 ml-1">
            {displayRows.length || linked.data?.length || 0}
          </Badge>
        </div>
      )}

      {!entityIdOrKey && (
        <p className="text-[11px] text-muted-foreground italic">
          Save this item first to attach handbook references.
        </p>
      )}

      {fallbackOnly && (
        <div className="rounded border border-dashed border-border bg-background/60 p-2 space-y-1">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Showing bundled fallback references — no DB links yet.
          </p>
          {(linked.data ?? []).map((r) => (
            <Link
              key={r.id}
              to={`/handbook/${r.slug}`}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <BookOpen className="w-3 h-3" />
              {r.title}
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </Link>
          ))}
        </div>
      )}

      {displayRows.map((row, idx) => (
        <div
          key={row.id}
          className="flex items-center gap-1.5 rounded border bg-background px-2 py-1.5 text-xs"
        >
          <BookOpen className="w-3 h-3 text-primary shrink-0" />
          <Link
            to={row.reference?.slug ? `/handbook/${row.reference.slug}` : "#"}
            className="font-medium hover:underline truncate flex-1"
            title="Open in handbook"
          >
            {row.reference?.title ?? "(missing reference)"}
          </Link>
          {row.reference?.category?.name && (
            <Badge variant="secondary" className="text-[9px] h-4">{row.reference.category.name}</Badge>
          )}
          <Link
            to={row.reference?.slug ? `/handbook/${row.reference.slug}` : "#"}
            className="text-muted-foreground hover:text-foreground"
            title="Jump to handbook entry"
          >
            <ExternalLink className="w-3 h-3" />
          </Link>
          {canManage && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                disabled={idx === 0 || reorder.isPending}
                onClick={() => moveRow(idx, -1)}
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                disabled={idx === displayRows.length - 1 || reorder.isPending}
                onClick={() => moveRow(idx, 1)}
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 text-destructive"
                onClick={() => removeLink.mutate(row.id)}
                disabled={removeLink.isPending}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      ))}

      {canManage && (
        <div className="space-y-1.5 pt-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Add a reference
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-2 w-3 h-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search handbook…"
              className="h-7 pl-7 text-xs"
            />
          </div>
          {search.trim().length >= 2 && (
            <div className="rounded border bg-background max-h-40 overflow-y-auto">
              {filteredResults.length === 0 && (
                <div className="p-2 text-[11px] text-muted-foreground italic">
                  No matches. You can create a new stub below.
                </div>
              )}
              {filteredResults.map((r: HandbookReference) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => addLink.mutate(r.id)}
                  disabled={addLink.isPending}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3 text-primary" />
                  <span className="truncate">{r.title}</span>
                  {r.category?.name && (
                    <Badge variant="outline" className="text-[9px] h-4 ml-auto">{r.category.name}</Badge>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <HandbookCreateReferenceDialog
              initialTitle={search}
              onCreated={(ref) => addLink.mutate(ref.id)}
            />
          </div>
        </div>
      )}
    </Wrapper>
  );
}
