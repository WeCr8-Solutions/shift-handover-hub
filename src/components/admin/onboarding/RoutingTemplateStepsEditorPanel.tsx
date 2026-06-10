import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Workflow, Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useRoutingTemplateSteps, type RoutingTemplateStep } from "@/hooks/useRoutingTemplateSteps";

interface Props { organizationId: string | null }

export function RoutingTemplateStepsEditorPanel({ organizationId }: Props) {
  const templates = useQuery({
    queryKey: ["concierge-routing-templates", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("routing_templates")
        .select("id, name")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string }>;
    },
  });
  const [templateId, setTemplateId] = useState<string | null>(null);
  useEffect(() => {
    if (!templateId && templates.data?.length) setTemplateId(templates.data[0].id);
  }, [templates.data, templateId]);

  const { query, upsert, remove, reorder } = useRoutingTemplateSteps(templateId);
  const steps = query.data ?? [];

  function move(idx: number, delta: number) {
    const next = [...steps];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    reorder.mutate(next.map((s) => s.id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Workflow className="w-4 h-4" /> Routing template steps
          {templateId && <Badge variant="secondary" className="text-[10px]">{steps.length} step{steps.length === 1 ? "" : "s"}</Badge>}
        </CardTitle>
        <CardDescription>
          Pick a routing template, then add, edit, reorder, or delete its operation steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.isLoading && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading templates…
          </div>
        )}
        {templates.data && templates.data.length === 0 && (
          <div className="border border-dashed rounded-md p-4 text-center text-xs text-muted-foreground">
            No routing templates yet. Create one in the Routing tab first.
          </div>
        )}
        {templates.data && templates.data.length > 0 && (
          <Select value={templateId ?? ""} onValueChange={setTemplateId}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Select template…" /></SelectTrigger>
            <SelectContent>
              {templates.data.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {templateId && (
          <>
            <div className="space-y-2">
              {steps.map((s, idx) => (
                <StepRow
                  key={s.id}
                  step={s}
                  index={idx}
                  total={steps.length}
                  busy={upsert.isPending || reorder.isPending}
                  onSave={(patch) => upsert.mutate({ stepId: s.id, patch })}
                  onRemove={() => remove.mutate(s.id)}
                  onUp={() => move(idx, -1)}
                  onDown={() => move(idx, +1)}
                />
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => upsert.mutate({ stepId: null, patch: { operation_name: "New step", operation_type: "internal" } })}
              disabled={upsert.isPending}
            >
              <Plus className="w-3.5 h-3.5" /> Add step
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StepRow({
  step, index, total, busy, onSave, onRemove, onUp, onDown,
}: {
  step: RoutingTemplateStep;
  index: number;
  total: number;
  busy: boolean;
  onSave: (patch: Record<string, any>) => void;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  const [draft, setDraft] = useState({
    operation_name: step.operation_name,
    operation_type: step.operation_type,
    work_center_type: step.work_center_type ?? "",
    setup_time_minutes: step.setup_time_minutes ?? "",
    cycle_time_minutes: step.cycle_time_minutes ?? "",
    first_article_minutes: step.first_article_minutes ?? "",
    instructions: step.instructions ?? "",
  });
  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">#{step.step_number}</Badge>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onUp} disabled={busy || index === 0}><ChevronUp className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onDown} disabled={busy || index === total - 1}><ChevronDown className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Operation name</Label>
          <Input value={draft.operation_name} onChange={(e) => setDraft({ ...draft, operation_name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={draft.operation_type} onValueChange={(v) => setDraft({ ...draft, operation_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["internal","outside_processing","inspection","assembly"].map((o) => (
                <SelectItem key={o} value={o} className="capitalize">{o.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Work center type</Label>
          <Input value={draft.work_center_type} onChange={(e) => setDraft({ ...draft, work_center_type: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Setup (min)</Label>
          <Input type="number" value={draft.setup_time_minutes as any} onChange={(e) => setDraft({ ...draft, setup_time_minutes: e.target.value as any })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cycle/part (min)</Label>
          <Input type="number" value={draft.cycle_time_minutes as any} onChange={(e) => setDraft({ ...draft, cycle_time_minutes: e.target.value as any })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">First article (min)</Label>
          <Input type="number" value={draft.first_article_minutes as any} onChange={(e) => setDraft({ ...draft, first_article_minutes: e.target.value as any })} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Instructions</Label>
          <Input value={draft.instructions} onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} />
        </div>
      </div>
      <div className="flex justify-end gap-1.5">
        <Button size="sm" variant="outline" onClick={() => onSave(draft)} disabled={busy}>Save</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1.5">
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete step "{step.operation_name}"?</AlertDialogTitle>
              <AlertDialogDescription>Remaining steps keep their numbers; use the up/down arrows after to compact them.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onRemove}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
