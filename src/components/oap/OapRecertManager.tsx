import { useState } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CalendarClock, ShieldCheck, ShieldAlert, ShieldOff, RotateCcw, Pause, Play, History,
} from "lucide-react";
import {
  useRecertEvents, useRecordRecertEvent, type LifecycleStatus, type RecertEventType,
} from "@/hooks/useOapRecert";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: {
    id: string;
    organization_id: string;
    user_id: string;
    operator_name?: string | null;
    role_program_name?: string | null;
    next_recert_due?: string | null;
    lifecycle_status?: LifecycleStatus;
  };
}

type Action = "reschedule" | "recertify" | "waive" | "suspend" | "reinstate" | "revoke";

const ACTIONS: Array<{ key: Action; label: string; icon: typeof CalendarClock; eventType: RecertEventType; status?: LifecycleStatus; needsDate?: boolean }> = [
  { key: "reschedule", label: "Reschedule due date", icon: CalendarClock, eventType: "rescheduled", needsDate: true },
  { key: "recertify",  label: "Mark recertified",   icon: ShieldCheck,    eventType: "recertified" },
  { key: "waive",      label: "Waive this cycle",   icon: ShieldAlert,    eventType: "waived",     status: "waived" },
  { key: "suspend",    label: "Suspend",            icon: Pause,          eventType: "suspended",  status: "suspended" },
  { key: "reinstate",  label: "Reinstate",          icon: Play,           eventType: "reinstated", status: "active" },
  { key: "revoke",     label: "Revoke (permanent)", icon: ShieldOff,      eventType: "revoked",    status: "revoked" },
];

export function OapRecertManager({ open, onOpenChange, enrollment }: Props) {
  const { data: events = [] } = useRecertEvents(open ? enrollment.id : null);
  const record = useRecordRecertEvent();

  const [action, setAction] = useState<Action>("reschedule");
  const [newDue, setNewDue] = useState(enrollment.next_recert_due?.slice(0, 10) ?? "");
  const [reason, setReason] = useState("");

  const cfg = ACTIONS.find((a) => a.key === action)!;

  async function handleSubmit() {
    await record.mutateAsync({
      enrollmentId: enrollment.id,
      organizationId: enrollment.organization_id,
      operatorUserId: enrollment.user_id,
      eventType: cfg.eventType,
      previousDue: enrollment.next_recert_due ?? null,
      newDue: cfg.needsDate ? (newDue ? new Date(newDue).toISOString() : null) : null,
      reason: reason || undefined,
      newLifecycleStatus: cfg.status,
    });
    setReason("");
  }

  const due = enrollment.next_recert_due ? new Date(enrollment.next_recert_due) : null;
  const overdue = due && isPast(due);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Recertification — {enrollment.operator_name ?? "operator"}
          </DialogTitle>
          <DialogDescription>
            {enrollment.role_program_name && <span className="font-medium">{enrollment.role_program_name} · </span>}
            {due ? (
              <>
                Next recert {overdue ? "was due" : "due"} <strong>{format(due, "MMM d, yyyy")}</strong>{" "}
                ({formatDistanceToNow(due, { addSuffix: true })})
              </>
            ) : (
              "No recert scheduled"
            )}
            {enrollment.lifecycle_status && enrollment.lifecycle_status !== "active" && (
              <Badge variant="outline" className="ml-2">{enrollment.lifecycle_status}</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={action} onValueChange={(v) => setAction(v as Action)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a.key} value={a.key}>
                      <span className="flex items-center gap-2"><a.icon className="w-3.5 h-3.5" />{a.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cfg.needsDate && (
              <div className="space-y-2">
                <Label htmlFor="newDue">New due date</Label>
                <Input id="newDue" type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason / notes (audit log)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this change being made? (visible in compliance audit trail)"
              rows={2}
            />
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <History className="w-4 h-4" /> Audit history
            </div>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recert events recorded yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                {events.map((e) => (
                  <li key={e.id} className="text-xs flex items-start gap-2 border-l-2 border-border pl-2">
                    <Badge variant="outline" className="text-[10px] uppercase">{e.event_type}</Badge>
                    <div className="flex-1">
                      <div className="text-muted-foreground">
                        {format(new Date(e.created_at), "MMM d, yyyy p")} · {e.acted_by_name ?? "system"}
                      </div>
                      {e.new_due && (
                        <div>New due: {format(new Date(e.new_due), "MMM d, yyyy")}</div>
                      )}
                      {e.reason && <div className="italic">"{e.reason}"</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSubmit} disabled={record.isPending} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Record {cfg.label.toLowerCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
