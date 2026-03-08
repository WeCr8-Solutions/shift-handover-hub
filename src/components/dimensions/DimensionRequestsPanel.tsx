import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DimensionCheckRequest } from "@/hooks/useDimensionRequests";
import { MessageSquare, Check, X, Loader2, Clock, ShieldCheck, ShieldX, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface DimensionRequestsPanelProps {
  requests: DimensionCheckRequest[];
  isSupervisor: boolean;
  onReview: (requestId: string, status: "approved" | "dismissed", notes?: string) => Promise<{ error: string | null }>;
  onAddDimensionDirect?: (stepId: string, req: {
    dimension_name: string;
    nominal_value: number;
    upper_tolerance: number;
    lower_tolerance: number;
    unit?: string;
    is_critical?: boolean;
    notes?: string;
  }) => Promise<{ error: string | null }>;
}

interface ApproveFormState {
  name: string;
  nominal: string;
  upperTol: string;
  lowerTol: string;
  unit: string;
  isCritical: boolean;
}

const DEFAULT_APPROVE_FORM: ApproveFormState = {
  name: "",
  nominal: "",
  upperTol: "0.005",
  lowerTol: "0.005",
  unit: "in",
  isCritical: false,
};

export function DimensionRequestsPanel({
  requests,
  isSupervisor,
  onReview,
  onAddDimensionDirect,
}: DimensionRequestsPanelProps) {
  const [activeAction, setActiveAction] = useState<{ id: string; mode: "approve" | "decline" } | null>(null);
  const [approveForm, setApproveForm] = useState<ApproveFormState>(DEFAULT_APPROVE_FORM);
  const [declineReason, setDeclineReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  if (requests.length === 0) return null;

  const handleApprove = async (req: DimensionCheckRequest) => {
    // Validate approve form
    if (!approveForm.name.trim()) {
      toast.error("Dimension name is required");
      return;
    }
    if (!approveForm.nominal || isNaN(parseFloat(approveForm.nominal))) {
      toast.error("Valid nominal value is required");
      return;
    }
    if (!approveForm.upperTol || isNaN(parseFloat(approveForm.upperTol)) || parseFloat(approveForm.upperTol) <= 0) {
      toast.error("Upper tolerance must be a positive number");
      return;
    }
    if (!approveForm.lowerTol || isNaN(parseFloat(approveForm.lowerTol)) || parseFloat(approveForm.lowerTol) <= 0) {
      toast.error("Lower tolerance must be a positive number");
      return;
    }

    setSubmitting(true);

    // 1. Add the dimension requirement to the routing step
    if (onAddDimensionDirect) {
      const { error: dimError } = await onAddDimensionDirect(req.routing_step_id, {
        dimension_name: approveForm.name.trim(),
        nominal_value: parseFloat(approveForm.nominal),
        upper_tolerance: parseFloat(approveForm.upperTol),
        lower_tolerance: parseFloat(approveForm.lowerTol),
        unit: approveForm.unit || "in",
        is_critical: approveForm.isCritical,
        notes: `Requested by ${req.requested_by_name || "operator"}: ${req.reason}`,
      });
      if (dimError) {
        toast.error("Failed to add dimension", { description: dimError });
        setSubmitting(false);
        return;
      }
    }

    // 2. Mark request as approved
    const { error } = await onReview(
      req.id,
      "approved",
      reviewNotes || `Added: ${approveForm.name.trim()} = ${approveForm.nominal} ±${approveForm.upperTol}/${approveForm.lowerTol} ${approveForm.unit}`
    );
    setSubmitting(false);

    if (!error) {
      toast.success("Dimension check approved", {
        description: `"${approveForm.name.trim()}" added to routing step.`,
      });
      resetForm();
    }
  };

  const handleDecline = async (req: DimensionCheckRequest) => {
    // Validate decline reason
    if (!declineReason.trim()) {
      toast.error("Decline reason is required", {
        description: "Provide a reason so the operator understands why the request was declined.",
      });
      return;
    }
    if (declineReason.trim().length < 10) {
      toast.error("Decline reason too short", {
        description: "Please provide a more detailed explanation (at least 10 characters).",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await onReview(req.id, "dismissed", declineReason.trim());
    setSubmitting(false);

    if (!error) {
      toast.info("Request declined", {
        description: `Operator "${req.requested_by_name}" will be notified.`,
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setActiveAction(null);
    setApproveForm(DEFAULT_APPROVE_FORM);
    setDeclineReason("");
    setReviewNotes("");
  };

  const openAction = (id: string, mode: "approve" | "decline", req: DimensionCheckRequest) => {
    resetForm();
    setActiveAction({ id, mode });
    // Pre-fill dimension name from request reason if it looks like a dimension
    if (mode === "approve") {
      const reasonLower = req.reason.toLowerCase();
      // Try to extract a dimension name hint from the reason
      const dimMatch = req.reason.match(/^([A-Za-z\s]+(?:bore|dia|od|id|length|width|height|depth|slot|hole|radius|thickness|gap))/i);
      if (dimMatch) {
        setApproveForm((prev) => ({ ...prev, name: dimMatch[1].trim() }));
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MessageSquare className="w-3.5 h-3.5" />
        Dimension Check Requests
        {pending.length > 0 && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            {pending.length}
          </Badge>
        )}
      </div>

      {pending.map((req) => {
        const isActive = activeAction?.id === req.id;
        const mode = activeAction?.mode;

        return (
          <div key={req.id} className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-2.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{req.requested_by_name || "Operator"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{req.reason}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                  {format(new Date(req.created_at), "MMM d, h:mm a")}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/50 shrink-0">
                Pending
              </Badge>
            </div>

            {isSupervisor && (
              <>
                {/* Action buttons when not reviewing */}
                {!isActive && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="gap-1 text-xs h-7 flex-1"
                      onClick={() => openAction(req.id, "approve", req)}
                    >
                      <ShieldCheck className="w-3 h-3" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-7 flex-1"
                      onClick={() => openAction(req.id, "decline", req)}
                    >
                      <ShieldX className="w-3 h-3" /> Decline
                    </Button>
                  </div>
                )}

                {/* APPROVE FLOW: inline dimension quick-add */}
                {isActive && mode === "approve" && (
                  <div className="space-y-2.5 pt-2 border-t border-amber-500/20">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Approve & Add Dimension
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px]">Dimension Name *</Label>
                        <Input
                          placeholder="e.g. OD Bore, Length, Slot Width"
                          value={approveForm.name}
                          onChange={(e) => setApproveForm((p) => ({ ...p, name: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Nominal *</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="2.5000"
                          value={approveForm.nominal}
                          onChange={(e) => setApproveForm((p) => ({ ...p, nominal: e.target.value }))}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Unit</Label>
                        <Input
                          value={approveForm.unit}
                          onChange={(e) => setApproveForm((p) => ({ ...p, unit: e.target.value }))}
                          className="h-7 text-xs"
                          placeholder="in"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">+ Upper Tol</Label>
                        <Input
                          type="number"
                          step="any"
                          value={approveForm.upperTol}
                          onChange={(e) => setApproveForm((p) => ({ ...p, upperTol: e.target.value }))}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">- Lower Tol</Label>
                        <Input
                          type="number"
                          step="any"
                          value={approveForm.lowerTol}
                          onChange={(e) => setApproveForm((p) => ({ ...p, lowerTol: e.target.value }))}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={approveForm.isCritical}
                        onCheckedChange={(v) => setApproveForm((p) => ({ ...p, isCritical: v }))}
                        id={`critical-${req.id}`}
                        className="scale-75"
                      />
                      <Label htmlFor={`critical-${req.id}`} className="text-[10px] cursor-pointer">
                        Critical dimension
                      </Label>
                    </div>

                    <Textarea
                      placeholder="Supervisor notes (optional)..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="text-xs min-h-[32px]"
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1 text-xs h-7 flex-1"
                        disabled={submitting}
                        onClick={() => handleApprove(req)}
                      >
                        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Confirm & Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        disabled={submitting}
                        onClick={resetForm}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* DECLINE FLOW: requires reason */}
                {isActive && mode === "decline" && (
                  <div className="space-y-2.5 pt-2 border-t border-amber-500/20">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <ShieldX className="w-3.5 h-3.5" />
                      Decline Request
                    </div>

                    <div className="flex items-start gap-1.5 p-2 rounded bg-destructive/5 border border-destructive/20">
                      <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                      <p className="text-[10px] text-destructive">
                        A reason is required when declining. This will be visible to the operator.
                      </p>
                    </div>

                    <Textarea
                      placeholder="Reason for declining — e.g. not applicable for this operation, already covered upstream, tolerance not critical..."
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      className="text-xs min-h-[50px]"
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1 text-xs h-7 flex-1"
                        disabled={submitting || !declineReason.trim()}
                        onClick={() => handleDecline(req)}
                      >
                        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        disabled={submitting}
                        onClick={resetForm}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {reviewed.length > 0 && (
        <details className="text-xs">
          <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
            {reviewed.length} reviewed request{reviewed.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-1 space-y-1">
            {reviewed.map((req) => (
              <div
                key={req.id}
                className={cn(
                  "border rounded p-2",
                  req.status === "approved" ? "border-green-500/20 bg-green-500/5" : "border-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{req.requested_by_name}: {req.reason}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      req.status === "approved" ? "text-green-600 border-green-500/50" : "text-muted-foreground"
                    )}
                  >
                    {req.status === "approved" ? "Approved" : "Declined"}
                  </Badge>
                </div>
                {req.review_notes && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">
                    {req.reviewed_by_name}: {req.review_notes}
                  </p>
                )}
                {req.reviewed_at && (
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(req.reviewed_at), "MMM d, h:mm a")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
