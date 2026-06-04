import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const STATE_OPTIONS = [
  { value: "Running", label: "Running" },
  { value: "Setup", label: "Setup / Changeover" },
  { value: "Waiting", label: "Waiting" },
  { value: "Down", label: "Down" },
] as const;

interface QuickStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stationId: string;
  stationName: string;
  onSaved?: () => void;
}

/**
 * Lightweight "I'm still here / status check-in" form for the middle of a
 * shift. Updates `current_station_status` rather than creating a full handoff
 * record — this is a status ping, not a shift change.
 */
export function QuickStatusDialog({
  open, onOpenChange, stationId, stationName, onSaved,
}: QuickStatusDialogProps) {
  const { user } = useAuth();
  const [state, setState] = useState<string>("Running");
  const [partsDelta, setPartsDelta] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setState("Running");
    setPartsDelta("");
    setNote("");
  };

  async function handleSave() {
    if (!user) {
      toast.error("Not signed in");
      return;
    }
    setSaving(true);
    try {
      // Read current status row to compute new parts_complete delta safely.
      const { data: cur } = await supabase
        .from("current_station_status")
        .select("parts_complete, condition_notes")
        .eq("station_id", stationId)
        .maybeSingle();

      const delta = parseInt(partsDelta, 10);
      const nextParts =
        Number.isFinite(delta) && delta > 0
          ? (cur?.parts_complete ?? 0) + delta
          : cur?.parts_complete ?? 0;

      const ts = new Date();
      const stamp = `[${ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}]`;
      const noteLine = note.trim()
        ? `${stamp} ${state.toUpperCase()} — ${note.trim()}`
        : `${stamp} ${state.toUpperCase()}`;

      const mergedNotes = cur?.condition_notes
        ? `${noteLine}\n${cur.condition_notes}`.slice(0, 4000)
        : noteLine;

      const { error } = await supabase
        .from("current_station_status")
        .upsert(
          {
            station_id: stationId,
            current_job_state: state,
            parts_complete: nextParts,
            condition_notes: mergedNotes,
            updated_at: ts.toISOString(),
          } as any,
          { onConflict: "station_id" },
        );

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Status updated");
      reset();
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="quick-status-dialog"
        aria-describedby="quick-status-desc"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            Quick Status — {stationName}
          </DialogTitle>
          <DialogDescription id="quick-status-desc">
            Mid-shift check-in. This updates the live station status without
            ending your shift.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Current State *</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger data-testid="quick-status-state">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Parts completed since last update</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={partsDelta}
              onChange={(e) => setPartsDelta(e.target.value)}
              data-testid="quick-status-parts"
            />
            <p className="text-[11px] text-muted-foreground">
              Optional. Adds to the running total for this WO.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              rows={3}
              placeholder="What's happening right now? (e.g. tool change at 14:20, waiting on QA)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              data-testid="quick-status-note"
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} data-testid="quick-status-save">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Post Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
