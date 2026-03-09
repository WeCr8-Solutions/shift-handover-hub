import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueueItem, QueueStatus, UpdateQueueItemInput } from "@/hooks/useQueue";
import { Station } from "@/hooks/useStations";
import { useToast } from "@/hooks/use-toast";
import { useAdminAccess } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Play, Pause, CheckCircle2, Loader2, ArrowRight, GitBranch,
  ShieldAlert, FileText, ArrowRightLeft,
} from "lucide-react";

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
  onOpenRouting,
  onOpenNCR,
  onCloseDialog,
}: QueueItemActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasAdminAccess, hasOrgSupervisorAccess } = useAdminAccess();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertWONumber, setConvertWONumber] = useState("");
  const [convertStationId, setConvertStationId] = useState<string | undefined>();
  const [converting, setConverting] = useState(false);

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
        toast({ title: "Transition Blocked", description: queueError, variant: "destructive" });
        setActionLoading(null);
        return;
      }
    }
    const { error } = await onUpdate(item.id, { status: "in_progress", started_at: new Date().toISOString() });
    setActionLoading(null);
    if (error) {
      toast({ title: "Transition Blocked", description: error, variant: "destructive" });
    } else {
      toast({ title: "Work Started", description: "Timer is now tracking this work order" });
      onReloadHistory();
    }
  };

  const handlePauseWork = async () => {
    setActionLoading("pause");
    const { error } = await onUpdate(item.id, { status: "on_hold" });
    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
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
      toast({
        title: "Quantity Check Required",
        description: `${unaccounted} parts unaccounted for. Completed: ${qtyCompleted}, Scrap: ${qtyScrap}, Rework: ${qtyRework} of ${qtyOriginal} total. Update quantities before advancing.`,
        variant: "destructive",
      });
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
        toast({ title: "Quality Sign-off Required", description: "Station is still 'Waiting on QA'. QA must be resolved before advancing.", variant: "destructive" });
        setActionLoading(null);
        return;
      }
      if (stationStatus?.current_job_state === "First Article in Process") {
        toast({ title: "First Article Pending", description: "First article inspection must be completed and approved before advancing to next operation.", variant: "destructive" });
        setActionLoading(null);
        return;
      }
    }

    // Use atomic RPC for routing advancement
    if (item.station_id && routingSteps.length > 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ title: "Error", description: "Authentication required", variant: "destructive" });
          setActionLoading(null);
          return;
        }

        const { data: result, error } = await supabase.rpc("pass_work_order_to_next_step", {
          _queue_item_id: item.id,
          _current_station_id: item.station_id,
          _actor_id: user.id,
          _is_override: false,
          _override_reason: null,
        });

        if (error) {
          toast({ title: "Transition Blocked", description: error.message, variant: "destructive" });
        } else {
          const action = (result as any)?.action;
          if (action === "advanced") {
            toast({ title: "Operation Complete", description: `Advanced to ${(result as any)?.next_station_name || "next station"}` });
          } else {
            toast({ title: "Work Order Completed!", description: "All operations finished" });
          }
          onReloadHistory();
          onReloadRouting();
        }
      } catch {
        toast({ title: "Error", description: "Failed to advance work order", variant: "destructive" });
      }
    } else {
      // No routing — simple completion
      const { error } = await onUpdate(item.id, { status: "completed", completed_at: new Date().toISOString() });
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        toast({ title: "Work Order Completed!", description: "All operations finished" });
        onReloadHistory();
      }
    }
    setActionLoading(null);
  };

  const handleCreateHandoff = () => {
    sessionStorage.setItem("handoff_prefill", JSON.stringify({
      work_order: item.work_order,
      part_number: item.part_number,
      operation_number: item.operation_number,
      station_id: item.station_id,
    }));
    sessionStorage.setItem("auto_open_handoff", "true");
    onCloseDialog();
    navigate("/dashboard");
  };

  const handleConvertToWorkOrder = async () => {
    if (!convertWONumber.trim()) {
      toast({ title: "Error", description: "Please enter a work order number", variant: "destructive" });
      return;
    }
    setConverting(true);
    const { error } = await supabase
      .from("queue_items")
      .update({ item_type: "work_order" as any, work_order: convertWONumber.trim(), station_id: convertStationId || item.station_id || null })
      .eq("id", item.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quote Converted", description: `Now tracking as Work Order: ${convertWONumber}` });
      setConvertDialogOpen(false);
      setConvertWONumber("");
      setConvertStationId(undefined);
      onReloadHistory();
    }
    setConverting(false);
  };

  if (isCompleted) return null;

  return (
    <>
      {/* Work Order Action Bar */}
      {isWorkOrder && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
          {canStart && (
            <Button onClick={handleStartWork} disabled={actionLoading === "start"} className="gap-2">
              {actionLoading === "start" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Start Work
            </Button>
          )}
          {canPause && (
            <Button variant="outline" onClick={handlePauseWork} disabled={actionLoading === "pause"} className="gap-2">
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
                className={cn("gap-2", hasNextStep ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700")}
              >
                {actionLoading === "complete" ? <Loader2 className="w-4 h-4 animate-spin" /> : hasNextStep ? <ArrowRight className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {hasNextStep ? "Complete Operation" : (routingSteps.length > 0 ? "Complete Work Order" : "Complete")}
              </Button>
            );
          })()}
          <div className="flex-1" />
          {onOpenRouting && hasOrgSupervisorAccess && (
            <Button variant="outline" onClick={() => onOpenRouting(item)} className="gap-2">
              <GitBranch className="w-4 h-4" />
              Edit Routing
            </Button>
          )}
          <Button variant="outline" onClick={onOpenNCR} className="gap-2">
            <ShieldAlert className="w-4 h-4" />
            Report NCR
          </Button>
          <Button variant="outline" onClick={handleCreateHandoff} className="gap-2">
            <FileText className="w-4 h-4" />
            Create Handoff
            <ArrowRight className="w-4 h-4" />
          </Button>
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
            {onOpenRouting && hasAdminAccess && (
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
    </>
  );
}
