import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useHandbookReferences, type HandbookEntityType } from "@/hooks/useHandbook";
import { Trash2, Link2, BookOpen } from "lucide-react";
import { toast } from "sonner";

const ENTITY_TYPES: { value: HandbookEntityType; label: string }[] = [
  { value: "operator_tool", label: "Operator Tool (key)" },
  { value: "inspection_tool", label: "Inspection Tool" },
  { value: "machining_operation", label: "Machining Operation" },
  { value: "gca_question_bank", label: "GCA Question Bank" },
  { value: "gca_question", label: "GCA Question" },
  { value: "oap_course", label: "OAP Course" },
  { value: "oap_lesson", label: "OAP Lesson" },
  { value: "oap_quiz_question", label: "OAP Quiz Question" },
];

interface LinkRow {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_key: string | null;
  reference_id: string;
  sort_order: number;
  reference: { title: string; slug: string } | null;
}

/**
 * Lightweight admin tool to attach/detach handbook references to entities.
 * Lets a platform admin wire the wrapper system without writing SQL.
 */
export function HandbookLinkManager() {
  const qc = useQueryClient();
  const [entityType, setEntityType] = useState<HandbookEntityType>("operator_tool");
  const [entityKey, setEntityKey] = useState("speed_feed_calculator");
  const [refSearch, setRefSearch] = useState("");
  const [pickedRefId, setPickedRefId] = useState<string>("");

  const { data: references = [] } = useHandbookReferences(
    refSearch.length >= 2 ? { search: refSearch } : undefined,
  );

  const links = useQuery({
    queryKey: ["handbook_links_admin", entityType, entityKey],
    enabled: !!entityKey,
    queryFn: async (): Promise<LinkRow[]> => {
      const { data, error } = await supabase
        .from("handbook_links")
        .select(
          "id, entity_type, entity_id, entity_key, reference_id, sort_order, reference:handbook_references(title, slug)",
        )
        .eq("entity_type", entityType)
        .eq("entity_key", entityKey)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LinkRow[];
    },
  });

  const addLink = useMutation({
    mutationFn: async () => {
      if (!pickedRefId) throw new Error("Pick a reference first");
      const { error } = await supabase.from("handbook_links").insert({
        entity_type: entityType,
        entity_key: entityKey,
        reference_id: pickedRefId,
        sort_order: (links.data?.length ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reference linked");
      setPickedRefId("");
      setRefSearch("");
      qc.invalidateQueries({ queryKey: ["handbook_links_admin"] });
      qc.invalidateQueries({ queryKey: ["handbook_links"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Failed to link"),
  });

  const removeLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("handbook_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link removed");
      qc.invalidateQueries({ queryKey: ["handbook_links_admin"] });
      qc.invalidateQueries({ queryKey: ["handbook_links"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" />
          Handbook Link Manager
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Attach Machinery's Handbook references to operator tools, OAP lessons,
          and GCA questions. Linked references appear automatically in the UI
          via <code>&lt;HandbookCite /&gt;</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Entity type</Label>
            <Select value={entityType} onValueChange={(v) => setEntityType(v as HandbookEntityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Entity key (e.g. <code>speed_feed_calculator</code>) or UUID</Label>
            <Input
              value={entityKey}
              onChange={(e) => setEntityKey(e.target.value)}
              placeholder="speed_feed_calculator"
            />
          </div>
        </div>

        <div className="border rounded p-3 space-y-2">
          <Label className="text-xs">Add reference</Label>
          <Input
            value={refSearch}
            onChange={(e) => setRefSearch(e.target.value)}
            placeholder="Search references…"
          />
          {refSearch.length >= 2 && (
            <div className="max-h-40 overflow-y-auto border rounded">
              {references.slice(0, 10).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setPickedRefId(r.id)}
                  className={`w-full text-left px-2 py-1.5 text-sm hover:bg-accent ${
                    pickedRefId === r.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="font-medium flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" />
                    {r.title}
                    {pickedRefId === r.id && (
                      <Badge variant="secondary" className="text-[10px]">selected</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <Button
            size="sm"
            disabled={!pickedRefId || !entityKey || addLink.isPending}
            onClick={() => addLink.mutate()}
          >
            Link reference
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Currently linked ({links.data?.length ?? 0})</Label>
          {links.isLoading && (
            <p className="text-xs text-muted-foreground">Loading…</p>
          )}
          {!links.isLoading && (links.data?.length ?? 0) === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No references linked to this entity yet.
            </p>
          )}
          {links.data?.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between border rounded px-2 py-1.5 text-sm"
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                {l.reference?.title ?? "Unknown reference"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeLink.mutate(l.id)}
                disabled={removeLink.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
