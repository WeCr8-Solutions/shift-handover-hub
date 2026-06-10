import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Factory, Plus, Trash2, Loader2 } from "lucide-react";
import { useWorkCenterConfigs, type WorkCenterConfigRow } from "@/hooks/useShiftAndWorkCenter";

const NEW_ROW: Partial<WorkCenterConfigRow> = {
  work_center_type: "milling",
  display_name: "Milling",
  default_cycle_time: null,
  default_setup_time: null,
  requires_first_article: true,
  requires_qa_signoff: false,
  track_scrap: true,
  track_rework: true,
  is_active: true,
  sort_order: 0,
};

interface Props { organizationId: string | null }

export function WorkCenterConfigEditorPanel({ organizationId }: Props) {
  const { query, upsert, remove } = useWorkCenterConfigs(organizationId);
  const [draft, setDraft] = useState<Partial<WorkCenterConfigRow>>(NEW_ROW);
  const rows = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Factory className="w-4 h-4" /> Work center configuration
          <Badge variant="secondary" className="text-[10px]">{rows.length}</Badge>
        </CardTitle>
        <CardDescription>
          Per-work-center planning defaults and quality requirements. Type must be unique within the organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        )}

        <div className="space-y-2">
          {rows.map((r) => (
            <WCRow
              key={r.id}
              row={r}
              busy={upsert.isPending}
              onSave={(next) => upsert.mutate({ ...next, id: r.id })}
              onRemove={() => remove.mutate(r.id)}
            />
          ))}
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Add new work center</div>
          <WCFields row={draft} setRow={setDraft} />
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => { upsert.mutate(draft); setDraft(NEW_ROW); }}
              disabled={upsert.isPending || !draft.work_center_type || !draft.display_name}
            >
              <Plus className="w-3.5 h-3.5" /> Add work center
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WCRow({
  row, busy, onSave, onRemove,
}: {
  row: WorkCenterConfigRow;
  busy: boolean;
  onSave: (next: Partial<WorkCenterConfigRow>) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<Partial<WorkCenterConfigRow>>(row);
  return (
    <div className="border rounded-md p-3 space-y-2">
      <WCFields row={draft} setRow={setDraft} />
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
              <AlertDialogTitle>Delete "{row.display_name}"?</AlertDialogTitle>
              <AlertDialogDescription>Existing routing steps that reference this type will keep the value.</AlertDialogDescription>
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

function WCFields({
  row, setRow,
}: {
  row: Partial<WorkCenterConfigRow>;
  setRow: (n: Partial<WorkCenterConfigRow>) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Type (unique key)</Label>
        <Input value={row.work_center_type ?? ""} onChange={(e) => setRow({ ...row, work_center_type: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Display name</Label>
        <Input value={row.display_name ?? ""} onChange={(e) => setRow({ ...row, display_name: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Default setup (min)</Label>
        <Input type="number" value={row.default_setup_time ?? ""} onChange={(e) => setRow({ ...row, default_setup_time: e.target.value === "" ? null : Number(e.target.value) })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Default cycle (min)</Label>
        <Input type="number" value={row.default_cycle_time ?? ""} onChange={(e) => setRow({ ...row, default_cycle_time: e.target.value === "" ? null : Number(e.target.value) })} />
      </div>
      <Toggle label="First-article required" value={row.requires_first_article !== false} onChange={(v) => setRow({ ...row, requires_first_article: v })} />
      <Toggle label="QA sign-off required" value={!!row.requires_qa_signoff} onChange={(v) => setRow({ ...row, requires_qa_signoff: v })} />
      <Toggle label="Track scrap" value={row.track_scrap !== false} onChange={(v) => setRow({ ...row, track_scrap: v })} />
      <Toggle label="Track rework" value={row.track_rework !== false} onChange={(v) => setRow({ ...row, track_rework: v })} />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2 border rounded-md px-3 py-2">
      <Label className="text-xs flex-1">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
