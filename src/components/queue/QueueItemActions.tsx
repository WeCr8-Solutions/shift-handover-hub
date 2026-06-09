import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { QueueItem, QueueStatus, UpdateQueueItemInput } from "@/hooks/useQueue";
import { Station } from "@/hooks/useStations";
import { woToast } from "@/lib/woToast";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";
import { useOrgContext } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Play, Pause, CheckCircle2, Loader2, ArrowRight, GitBranch,
  ShieldAlert, FileText, ArrowRightLeft, Copy,
} from "lucide-react";
import { PrintTravelerButton } from "@/components/work-orders/traveler/PrintTravelerButton";
import { PrintCoCButton } from "@/components/work-orders/coc/PrintCoCButton";

interface RoutingStepRow {
  id: string;
  step_number: number;
  operation_name: string;
  status: string;
  station_id: string | null;
  station_name?: string | null;
}

interface QueueItemActionsProps {
  item: QueueItem;
  stations: Station[];
  routingSteps: RoutingStepRow[];
  onUpdate: (id: string, input: UpdateQueueItemInput) => Promise<{ error: string | null }>;
  onReloadHistory: () => void;
  onReloadRouting: () => void;
  /** Refresh parent items list so station_id / status reflect server state after RPC advances. */
  onRefreshItems?: () => void;
  onOpenRouting?: (item: { id: string; work_order?: string | null; part_number?: string | null }) => void;
  onOpenNCR: () => void;
  onCloseDialog: () => void;
}

export function QueueItemActions({
  item,
  stations,
  routingSteps,
  onUpdate,
  onReloadHistory,
  onReloadRouting,
  onRefreshItems,
  onOpenRouting,
  onOpenNCR,
  onCloseDialog,
}: QueueItemActionsProps) {
  const navigate = useNavigate();
  const wo = item.work_order ?? null;
  const { hasAdminAccess, hasOrgSupervisorAccess } = useAdminAccess();
  const { organization } = useOrgContext();
  const { getSetting } = useGeneralSettings();
  const mfgPrefs = (getSetting("manufacturing_preferences") || {}) as Record<string, unknown>;
  const autoConvertOnApproval = mfgPrefs.quoteAutoConvertOnApproval === true;
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertWONumber, setConvertWONumber] = useState("");
  const [convertStationId, setConvertStationId] = useState<string | undefined>();
  const [converting, setConverting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [handoffPrompt, setHandoffPrompt] = useState<{
    open: boolean;
    nextStationId?: string | null;
    nextStationName?: string | null;
    nextOperationName?: string | null;
    nextOperationNumber?: string | null;
    finalCompletion: boolean;
  }>({ open: false, finalCompletion: false });

  const handleCloneWorkOrder = async () => {
    setCloning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: full, error: loadErr } = await supabase
        .from("queue_items")
        .select("*")
        .eq("id", item.id)
        .single();
      if (loadErr || !full) throw loadErr || new Error("Work order not found");

      // Strip identity / lifecycle / progress fields — keep production spec data
      const {
        id: _omitId, created_at: _omitCreated, updated_at: _omitUpdated,
        completed_at: _omitCompleted, started_at: _omitStarted,
        converted_to_work_order_id: _omitCw, source_quote_id: _omitSq,
        converted_at: _omitCa, converted_by: _omitCb,
        qty_completed: _omitQc, qty_scrap: _omitQs, qty_rework: _omitQr,
        qty_open: _omitQo, parts_completed: _omitPc,
        ...cloneable
      } = full as Record<string, unknown>;

      const baseWO = (item.work_order ?? "WO").toString();
      const nextWO = `${baseWO}-COPY-${Date.now().toString(36).slice(-4).toUpperCase()}`;

      const { data: newWO, error: insertErr } = await supabase
        .from("queue_items")
        .insert({
          ...cloneable,
          item_type: "work_order",
          status: "pending",
          work_order: nextWO,
          qty_completed: 0,
          qty_scrap: 0,
          qty_rework: 0,
          parts_completed: 0,
          created_by: user?.id ?? (cloneable as { created_by?: string }).created_by,
        } as never)
        .select("id, work_order")
        .single();
      if (insertErr || !newWO) throw insertErr || new Error("Failed to clone work order");

      // Copy routing steps — pending status, no completion metadata
      const { data: routing } = await supabase
        .from("work_order_routing")
        .select("*")
        .eq("queue_item_id", item.id);
      if (routing && routing.length > 0) {
        const newSteps = routing.map((r: Record<string, unknown>) => {
          const { id: _id, queue_item_id: _q, created_at: _c, updated_at: _u,
                  started_at: _s, completed_at: _co, completed_by: _cb,
                  ...rest } = r;
          return { ...rest, queue_item_id: newWO.id, status: "pending" };
        });
        await supabase.from("work_order_routing").insert(newSteps as never);
      }

      woToast.success(
        "Work order cloned",
        wo,
        `Created ${newWO.work_order}. Edit the WO number, qty, or due date as needed.`,
      );
      onReloadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Clone failed";
      woToast.error("Clone failed", message, wo);
    } finally {
      setCloning(false);
    }
  };

  const isQuote = item.item_type === "quote";
  const isWorkOrder = item.item_type === "work_order";
  const isCompleted = item.status === "completed";
  const canStart = item.status === "pending" || item.status === "queued";
  const canPause = item.status === "in_progress";
  const canComplete = item.status === "in_progress" || item.status === "on_hold";

  const handleStartWork = async () => {
    setActionLoading("start");
    if (item.status === "pending") {
      const { error: queueError } = await onUpdate(item.id, { status: "queued" });
      if (queueError) {
        woToast.blocked("Transition blocked", queueError, wo);
        setActionLoading(null);
        return;
      }
    }
    const { error } = await onUpdate(item.id, { status: "in_progress", started_at: new Date().toISOString() });
    setActionLoading(null);
    if (error) {
      woToast.blocked("Transition blocked", error, wo);
    } else {
      woToast.success("Work started", wo, "Timer is now tracking this work order");
      onReloadHistory();
    }
  };

  const handlePauseWork = async () => {
    setActionLoading("pause");
    const { error } = await onUpdate(item.id, { status: "on_hold" });
    setActionLoading(null);
    if (error) {
      woToast.error("Failed to pause work", error, wo);
    } else {
      woToast.success("Work paused", wo);
      onReloadHistory();
    }
  };

  const handleCompleteWork = async () => {
    setActionLoading("complete");

    // Pre-advance validation
    const qtyCompleted = item.qty_completed ?? item.parts_completed ?? 0;
    const qtyOriginal = item.qty_original ?? item.quantity ?? 0;
    const qtyScrap = item.qty_scrap ?? 0;
    const qtyRework = item.qty_rework ?? 0;

    if (qtyOriginal > 0 && (qtyCompleted + qtyScrap + qtyRework) < qtyOriginal) {
      const unaccounted = qtyOriginal - qtyCompleted - qtyScrap - qtyRework;
      woToast.blocked(
        "Quantity check required",
        `${unaccounted} parts unaccounted for. Completed: ${qtyCompleted}, Scrap: ${qtyScrap}, Rework: ${qtyRework} of ${qtyOriginal} total. Update quantities before advancing.`,
        wo,
      );
      setActionLoading(null);
      return;
    }

    if (item.station_id) {
      const { data: stationStatus } = await supabase
        .from("current_station_status")
        .select("current_job_state")
        .eq("station_id", item.station_id)
        .maybeSingle();

      if (stationStatus?.current_job_state === "Waiting on QA") {
        woToast.blocked(
          "Quality sign-off required",
          "Station is still 'Waiting on QA'. QA must be resolved before advancing.",
          wo,
        );
        setActionLoading(null);
        return;
      }
      if (stationStatus?.current_job_state === "First Article in Process") {
        woToast.blocked(
          "First article pending",
          "First article inspection must be completed and approved before advancing to next operation.",
          wo,
        );
        setActionLoading(null);
        return;
      }
    }

    // Use atomic RPC for routing advancement
    if (item.station_id && routingSteps.length > 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          woToast.error("Authentication required", undefined, wo);
          setActionLoading(null);
          return;
        }

        const { data: result, error } = await supabase.rpc("pass_work_order_to_next_step", {
          _queue_item_id: item.id,
          _current_station_id: item.station_id,
          _actor_id: user.id,
          _is_override: false,
          _override_reason: undefined,
        });

        if (error) {
          woToast.blocked("Transition blocked", error.message, wo);
        } else {
          const action = (result as any)?.action;
          const nextStationName = (result as any)?.next_station_name as string | undefined;
          const nextStationId = (result as any)?.next_station_id as string | undefined;
          const nextOperationName = (result as any)?.next_operation_name as string | undefined;
          const nextOperationNumber = (result as any)?.next_operation_number as string | undefined;
          if (action === "advanced") {
            woToast.success("Operation complete", wo, `Advanced to ${nextStationName || "next station"}`);
            setHandoffPrompt({
              open: true,
              nextStationId: nextStationId ?? null,
              nextStationName: nextStationName ?? null,
              nextOperationName: nextOperationName ?? null,
              nextOperationNumber: nextOperationNumber ?? null,
              finalCompletion: false,
            });
          } else {
            woToast.success("Work order completed!", wo, "All operations finished");
            setHandoffPrompt({ open: true, finalCompletion: true });
          }
          onReloadHistory();
          onReloadRouting();
          // Refresh parent items list so the WO's new station_id / status (or completed_at)
          // is reflected immediately in Kanban / list views without waiting for realtime.
          onRefreshItems?.();
        }
      } catch {
        woToast.error("Failed to advance work order", undefined, wo);
      }
    } else {
      // No routing — simple completion. Stop the clock by clearing started_at
      // alongside the completed_at stamp so dashboards don't keep ticking.
      const { error } = await onUpdate(item.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        started_at: null,
      });
      if (error) {
        woToast.error("Failed to complete", error, wo);
      } else {
        woToast.success("Work order completed!", wo, "All operations finished");
        onReloadHistory();
        onRefreshItems?.();
        setHandoffPrompt({ open: true, finalCompletion: true });
      }
    }
    setActionLoading(null);
  };

  const handleCreateHandoff = (overrides?: {
    station_id?: string | null;
    operation_number?: string | null;
    next_station_id?: string | null;
    next_station_name?: string | null;
    next_operation_name?: string | null;
    next_operation_number?: string | null;
  }) => {
    sessionStorage.setItem("handoff_prefill", JSON.stringify({
      work_order: item.work_order,
      part_number: item.part_number,
      operation_number: overrides?.operation_number ?? item.operation_number,
      station_id: overrides?.station_id ?? item.station_id,
      next_station_id: overrides?.next_station_id ?? null,
      next_station_name: overrides?.next_station_name ?? null,
      next_operation_name: overrides?.next_operation_name ?? null,
      next_operation_number: overrides?.next_operation_number ?? null,
    }));
    sessionStorage.setItem("auto_open_handoff", "true");
    onCloseDialog();
    navigate("/dashboard");
  };

  const handleConfirmHandoffPrompt = () => {
    handleCreateHandoff({
      station_id: item.station_id,
      operation_number: item.operation_number,
      next_station_id: handoffPrompt.nextStationId,
      next_station_name: handoffPrompt.nextStationName,
      next_operation_name: handoffPrompt.nextOperationName,
      next_operation_number: handoffPrompt.nextOperationNumber,
    });
    setHandoffPrompt((p) => ({ ...p, open: false }));
  };


  const fetchNextWONumber = async (): Promise<string> => {
    if (!organization?.id) return "";
    const { data, error } = await (supabase.rpc as any)("generate_next_wo_number", {
      _organization_id: organization.id,
      _kind: "work_order",
    });
    if (error) {
      console.error("generate_next_wo_number failed", error);
      return "";
    }
    return (data as string) || "";
  };

  const handleOpenConvertDialog = async () => {
    setConvertWONumber(item.work_order || "");
    setConvertStationId(item.station_id || undefined);
    setConvertDialogOpen(true);
    // Always suggest the next sequential WO# from org numbering settings.
    const next = await fetchNextWONumber();
    if (next) setConvertWONumber(next);
  };

  const handleConvertToWorkOrder = async (overrideWONumber?: string) => {
    const targetWO = (overrideWONumber ?? convertWONumber).trim();
    if (!targetWO) {
      woToast.error("Work order number required", "Please enter a work order number", wo);
      return;
    }
    setConverting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1) Clone the quote row into a new work_order row (preserves quote as historical record)
      const { data: full, error: loadErr } = await supabase
        .from("queue_items")
        .select("*")
        .eq("id", item.id)
        .single();
      if (loadErr || !full) throw loadErr || new Error("Quote not found");

      // Strip identity / lifecycle fields — keep all production/spec data
      const {
        id: _omitId, created_at: _omitCreated, updated_at: _omitUpdated,
        completed_at: _omitCompleted, started_at: _omitStarted,
        converted_to_work_order_id: _omitCw, source_quote_id: _omitSq,
        converted_at: _omitCa, converted_by: _omitCb,
        ...cloneable
      } = full as Record<string, unknown>;

      const newStationId = convertStationId || (item.station_id as string | null) || null;
      const { data: newWO, error: insertErr } = await supabase
        .from("queue_items")
        .insert({
          ...cloneable,
          item_type: "work_order",
          status: "pending",
          work_order: targetWO,
          station_id: newStationId,
          source_quote_id: item.id,
          created_by: user?.id ?? (cloneable as { created_by?: string }).created_by,
        } as never)
        .select("id")
        .single();
      if (insertErr || !newWO) throw insertErr || new Error("Failed to create work order");

      // 2) Copy routing steps from quote to new work order (estimation routing → production routing)
      const { data: routing } = await supabase
        .from("work_order_routing")
        .select("*")
        .eq("queue_item_id", item.id);
      if (routing && routing.length > 0) {
        const newSteps = routing.map((r: Record<string, unknown>) => {
          const { id: _id, queue_item_id: _q, created_at: _c, updated_at: _u,
                  started_at: _s, completed_at: _co, completed_by: _cb,
                  ...rest } = r;
          return { ...rest, queue_item_id: newWO.id, status: "pending" };
        });
        await supabase.from("work_order_routing").insert(newSteps as never);
      }

      // 3) Mark the quote as completed + linked to the new WO (preserves history)
      const { error: updateErr } = await supabase
        .from("queue_items")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          converted_to_work_order_id: newWO.id,
          converted_at: new Date().toISOString(),
          converted_by: user?.id ?? null,
        } as never)
        .eq("id", item.id);
      if (updateErr) throw updateErr;

      woToast.success("Quote converted", targetWO, `Now tracking as Work Order: ${targetWO}`);
      setConvertDialogOpen(false);
      setConvertWONumber("");
      setConvertStationId(undefined);
      onReloadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Conversion failed";
      woToast.error("Conversion failed", message, wo);
    } finally {
      setConverting(false);
    }
  };

  if (isCompleted) return null;

  return (
    <>
      {/* Work Order Action Bar */}
      {isWorkOrder && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border" data-testid="wo-action-bar">
          {canStart && (
            <Button onClick={handleStartWork} disabled={actionLoading === "start"} className="gap-2" data-testid="wo-start">
              {actionLoading === "start" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Start Work
            </Button>
          )}
          {canPause && (
            <Button variant="outline" onClick={handlePauseWork} disabled={actionLoading === "pause"} className="gap-2" data-testid="wo-pause">
              {actionLoading === "pause" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
              Pause
            </Button>
          )}
          {canComplete && (() => {
            const currentStepIdx = routingSteps.findIndex(s => s.station_id === item.station_id && s.status !== "completed");
            const hasNextStep = currentStepIdx >= 0 && routingSteps[currentStepIdx + 1];
            return (
              <Button
                variant="default"
                onClick={handleCompleteWork}
                disabled={actionLoading === "complete"}
                data-testid={hasNextStep ? "wo-next-op" : "wo-complete"}
                className={cn("gap-2", hasNextStep ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700")}
              >
                {actionLoading === "complete" ? <Loader2 className="w-4 h-4 animate-spin" /> : hasNextStep ? <ArrowRight className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {hasNextStep ? "Complete Operation" : (routingSteps.length > 0 ? "Complete Work Order" : "Complete")}
              </Button>
            );
          })()}
          <div className="flex-1" />
          {onOpenRouting && hasOrgSupervisorAccess && (
            <Button variant="outline" onClick={() => onOpenRouting(item)} className="gap-2" data-testid="wo-edit-routing">
              <GitBranch className="w-4 h-4" />
              Edit Routing
            </Button>
          )}
          <Button variant="outline" onClick={onOpenNCR} className="gap-2" data-testid="ncr-create">
            <ShieldAlert className="w-4 h-4" />
            Report NCR
          </Button>
          <Button variant="outline" onClick={() => handleCreateHandoff()} className="gap-2" data-testid="new-handoff">
            <FileText className="w-4 h-4" />
            Create Handoff
            <ArrowRight className="w-4 h-4" />
          </Button>
          {hasOrgSupervisorAccess && (
            <Button
              variant="outline"
              onClick={handleCloneWorkOrder}
              disabled={cloning}
              className="gap-2"
              data-testid="wo-clone"
              title="Duplicate this work order's specs and routing as a new pending WO"
            >
              {cloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Clone WO
            </Button>
          )}
          <PrintTravelerButton workOrderId={item.id} priority={item.priority} />
          <PrintCoCButton workOrderId={item.id} disabled={item.status !== "completed"} />
        </div>
      )}

      {/* Quote Action Bar */}
      {isQuote && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30" data-tour="quote-convert-bar">
            <Button
              onClick={() => {
                setConvertWONumber(item.work_order || "");
                setConvertStationId(item.station_id || undefined);
                setConvertDialogOpen(true);
              }}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Convert to Work Order
            </Button>
            {onOpenRouting && hasOrgSupervisorAccess && (
              <Button variant="outline" onClick={() => onOpenRouting(item)} className="gap-2">
                <GitBranch className="w-4 h-4" />
                Edit Routing
              </Button>
            )}
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground self-center">
              {item.work_order && `Quote: ${item.work_order}`}
            </span>
          </div>

          {convertDialogOpen && (
            <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Convert Quote to Work Order
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Work Order Number</Label>
                  <Input value={convertWONumber} onChange={(e) => setConvertWONumber(e.target.value)} placeholder="Enter work order number" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Assign Station (optional)</Label>
                  <Select value={convertStationId || "none"} onValueChange={(v) => setConvertStationId(v === "none" ? undefined : v)}>
                    <SelectTrigger><SelectValue placeholder="Select station..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No station (assign later)</SelectItem>
                      {stations.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.station_id} - {s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConvertToWorkOrder} disabled={converting} className="gap-2">
                  {converting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Conversion
                </Button>
                <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog
        open={handoffPrompt.open}
        onOpenChange={(o) => setHandoffPrompt((p) => ({ ...p, open: o }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {handoffPrompt.finalCompletion ? "Work Order Completed" : "Operation Complete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {handoffPrompt.finalCompletion ? (
                <>Create a final shift handoff for <strong>{item.work_order}</strong> to log completion?</>
              ) : (
                <>
                  Create a handoff to pass <strong>{item.work_order}</strong> to{" "}
                  <strong>{handoffPrompt.nextStationName || "the next station"}</strong>
                  {handoffPrompt.nextOperationName ? <> for <strong>{handoffPrompt.nextOperationName}</strong></> : null}?
                  <span className="block mt-2 text-xs">Work order, part number, and next-op details will be auto-filled.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmHandoffPrompt}>
              Create Handoff
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
