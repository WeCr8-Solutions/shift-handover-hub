import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, PauseCircle } from "lucide-react";

export type CancelHoldMode = "cancel" | "hold";

const CANCEL_REASONS = [
  "Customer cancelled order",
  "Duplicate work order",
  "Material unavailable",
  "Engineering / drawing change",
  "Scrapped beyond rework",
  "Wrong work order created",
  "Other (see notes)",
];

const HOLD_REASONS = [
  "Awaiting material",
  "Awaiting customer approval",
  "Tooling unavailable",
  "Machine down",
  "Quality / NCR review",
  "Engineering hold",
  "Other (see notes)",
];

interface Props {
  open: boolean;
  mode: CancelHoldMode;
  workOrderLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<{ error: string | null } | void>;
}

export function CancelHoldDialog({ open, mode, workOrderLabel, onOpenChange, onConfirm }: Props) {
  const [reasonCode, setReasonCode] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReasonCode("");
      setNotes("");
      setSubmitting(false);
    }
  }, [open]);

  const isCancel = mode === "cancel";
  const reasons = isCancel ? CANCEL_REASONS : HOLD_REASONS;
  const Icon = isCancel ? AlertTriangle : PauseCircle;

  const handleConfirm = async () => {
    if (!reasonCode) return;
    const composed = notes.trim() ? `${reasonCode} — ${notes.trim()}` : reasonCode;
    setSubmitting(true);
    await onConfirm(composed);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={isCancel ? "w-5 h-5 text-destructive" : "w-5 h-5 text-warning"} />
            {isCancel ? "Cancel work order" : "Place work order on hold"}
          </DialogTitle>
          <DialogDescription>
            {workOrderLabel ? <span className="font-medium">{workOrderLabel}</span> : null}
            <span className="block mt-1 text-xs">
              {isCancel
                ? "Cancelled work orders are kept in the database for audit and review. Pick a reason so reviewers know why."
                : "Held work orders pause production. Provide a reason so the next operator or supervisor understands the block."}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Reason</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add detail for the audit trail…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={isCancel ? "destructive" : "default"}
            disabled={!reasonCode || submitting}
            onClick={handleConfirm}
          >
            {submitting ? "Saving…" : isCancel ? "Cancel work order" : "Place on hold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
