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
import { Clock, Plus, Trash2, Loader2 } from "lucide-react";
import { useShiftSchedules, type ShiftScheduleRow } from "@/hooks/useShiftAndWorkCenter";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const NEW_ROW: Partial<ShiftScheduleRow> = {
  shift_name: "Day",
  shift_code: "DAY",
  start_time: "07:00",
  end_time: "15:30",
  days_of_week: [1,2,3,4,5],
  is_active: true,
  color: "#3b82f6",
};

interface Props { organizationId: string | null }

export function ShiftSchedulesEditorPanel({ organizationId }: Props) {
  const { query, upsert, remove } = useShiftSchedules(organizationId);
  const [draft, setDraft] = useState<Partial<ShiftScheduleRow>>(NEW_ROW);
  const rows = query.data ?? [];

  function toggleDay(target: Partial<ShiftScheduleRow>, day: number, setter: (next: Partial<ShiftScheduleRow>) => void) {
    const cur = target.days_of_week ?? [];
    const next = cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day].sort();
    setter({ ...target, days_of_week: next });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4" /> Shift schedules
          <Badge variant="secondary" className="text-[10px]">{rows.length}</Badge>
        </CardTitle>
        <CardDescription>
          Define baseline shifts so capacity planning and operator assignment start with sensible defaults.
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
            <ShiftRow
              key={r.id}
              row={r}
              busy={upsert.isPending}
              onSave={(next) => upsert.mutate({ ...next, id: r.id })}
              onRemove={() => remove.mutate(r.id)}
              toggleDay={toggleDay}
            />
          ))}
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Add new shift</div>
          <ShiftFields row={draft} setRow={setDraft} toggleDay={toggleDay} />
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                upsert.mutate(draft);
                setDraft(NEW_ROW);
              }}
              disabled={upsert.isPending || !draft.shift_name || !draft.shift_code}
            >
              <Plus className="w-3.5 h-3.5" /> Add shift
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShiftRow({
  row, busy, onSave, onRemove, toggleDay,
}: {
  row: ShiftScheduleRow;
  busy: boolean;
  onSave: (next: Partial<ShiftScheduleRow>) => void;
  onRemove: () => void;
  toggleDay: (t: Partial<ShiftScheduleRow>, d: number, s: (n: Partial<ShiftScheduleRow>) => void) => void;
}) {
  const [draft, setDraft] = useState<Partial<ShiftScheduleRow>>(row);
  return (
    <div className="border rounded-md p-3 space-y-2">
      <ShiftFields row={draft} setRow={setDraft} toggleDay={toggleDay} />
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
              <AlertDialogTitle>Delete shift "{row.shift_name}"?</AlertDialogTitle>
              <AlertDialogDescription>This removes all operator assignments linked to this shift.</AlertDialogDescription>
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

function ShiftFields({
  row, setRow, toggleDay,
}: {
  row: Partial<ShiftScheduleRow>;
  setRow: (n: Partial<ShiftScheduleRow>) => void;
  toggleDay: (t: Partial<ShiftScheduleRow>, d: number, s: (n: Partial<ShiftScheduleRow>) => void) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Name</Label>
        <Input value={row.shift_name ?? ""} onChange={(e) => setRow({ ...row, shift_name: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Code</Label>
        <Input value={row.shift_code ?? ""} onChange={(e) => setRow({ ...row, shift_code: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Start</Label>
        <Input type="time" value={row.start_time ?? ""} onChange={(e) => setRow({ ...row, start_time: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">End</Label>
        <Input type="time" value={row.end_time ?? ""} onChange={(e) => setRow({ ...row, end_time: e.target.value })} />
      </div>
      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
        <Label className="text-xs">Days</Label>
        <div className="flex flex-wrap gap-1">
          {DAYS.map((d, i) => {
            const on = (row.days_of_week ?? []).includes(i);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(row, i, setRow)}
                className={`h-7 px-2 rounded text-[11px] border transition-colors ${
                  on ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                }`}
              >{d}</button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 border rounded-md px-3 py-2">
        <Label className="text-xs flex-1">Active</Label>
        <Switch checked={row.is_active !== false} onCheckedChange={(v) => setRow({ ...row, is_active: v })} />
      </div>
    </div>
  );
}
