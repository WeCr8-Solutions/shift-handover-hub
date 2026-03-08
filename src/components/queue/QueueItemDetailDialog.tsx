import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { QueueItem, QueueItemComment, QueueItemHistory, QueueStatus, QueuePriority, UpdateQueueItemInput, RoutingStepInput } from "@/hooks/useQueue";
import { useStations } from "@/hooks/useStations";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useToast } from "@/hooks/use-toast";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useNCR } from "@/hooks/useNCR";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { QuantitySummaryCard } from "@/components/ncr/QuantitySummaryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateNCRDialog } from "@/components/ncr/CreateNCRDialog";
import { NCRListView } from "@/components/ncr/NCRListView";
import { RoutingSection } from "@/components/queue/RoutingSection";
import { 
  Clock, User, Package, Send, History, MessageSquare, Trash2, Loader2,
  Play, Pause, CheckCircle2, Wrench, FileText, AlertTriangle, ArrowRight, GitBranch,
  CircleDot, Circle, CheckCircle, Timer, Truck, ShieldAlert, ArrowRightLeft, Plug, Save
} from "lucide-react";

interface RoutingStepRow {
  id: string;
  step_number: number;
  operation_name: string;
  operation_type: string;
  status: string;
  station_id: string | null;
  estimated_duration: number | null;
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  outside_vendor: string | null;
  po_number: string | null;
  expected_return_date: string | null;
  completed_by_name?: string | null;
  station_name?: string | null;
  station_code?: string | null;
}

interface QueueItemDetailDialogProps {
  item: QueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, input: UpdateQueueItemInput) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
  onAddComment: (itemId: string, content: string) => Promise<{ error: string | null }>;
  getComments: (itemId: string) => Promise<{ data: QueueItemComment[] | null; error: string | null }>;
  getHistory: (itemId: string) => Promise<{ data: QueueItemHistory[] | null; error: string | null }>;
  onOpenRouting?: (item: { id: string; work_order?: string | null; part_number?: string | null }) => void;
}

const statusOptions: { value: QueueStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// Valid state transitions matching the DB trigger
const VALID_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  pending: ["queued", "cancelled"],
  queued: ["in_progress", "cancelled", "pending"],
  in_progress: ["on_hold", "completed", "queued", "cancelled"],
  on_hold: ["in_progress", "cancelled"],
  completed: ["pending"],
  cancelled: [],
};

const priorityOptions: { value: QueuePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
  { value: "critical", label: "Critical" },
];

function getPriorityColor(priority: QueuePriority): string {
  switch (priority) {
    case "critical": return "bg-red-500 text-white";
    case "urgent": return "bg-orange-500 text-white";
    case "high": return "bg-yellow-500 text-white";
    case "normal": return "bg-blue-500 text-white";
    case "low": return "bg-gray-400 text-white";
  }
}

function getStatusColor(status: QueueStatus): string {
  switch (status) {
    case "pending": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    case "queued": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "on_hold": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
}

export function QueueItemDetailDialog({
  item,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onAddComment,
  getComments,
  getHistory,
  onOpenRouting,
}: QueueItemDetailDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentTeam } = useCurrentTeam();
  const { organization } = useUserOrganization();
  const { stations } = useStations(currentTeam?.id, organization?.id);
  const { hasAdminAccess } = useAdminAccess();
  const { ncrs, createNCR, uploadNCRImage } = useNCR(item ? { queue_item_id: item.id } : undefined);
  const [comments, setComments] = useState<QueueItemComment[]>([]);
  const [history, setHistory] = useState<QueueItemHistory[]>([]);
  const [routingSteps, setRoutingSteps] = useState<RoutingStepRow[]>([]);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ncrDialogOpen, setNcrDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertWONumber, setConvertWONumber] = useState("");
  const [convertStationId, setConvertStationId] = useState<string | undefined>();
  const [converting, setConverting] = useState(false);
  // Inline routing creation state
  const [addingRouting, setAddingRouting] = useState(false);
  const [newRoutingSteps, setNewRoutingSteps] = useState<RoutingStepInput[]>([]);
  const [savingRouting, setSavingRouting] = useState(false);
  // Get station info if assigned
  const assignedStation = item?.station_id ? stations.find(s => s.id === item.station_id) : null;

  useEffect(() => {
    if (item && open) {
      loadComments();
      loadHistory();
      loadRouting();
    }
  }, [item, open]);

  const loadRouting = async () => {
    if (!item) return;
    setRoutingLoading(true);
    try {
      // Fetch routing steps with completed_by profile name and station info
      const { data, error } = await supabase
        .from('work_order_routing')
        .select('*')
        .eq('queue_item_id', item.id)
        .order('step_number', { ascending: true });

      if (error) throw error;

      // Enrich with profile names and station info
      if (data && data.length > 0) {
        const completedByIds = [...new Set(data.filter(s => s.completed_by).map(s => s.completed_by!))];
        const stationIds = [...new Set(data.filter(s => s.station_id).map(s => s.station_id!))];

        const [profilesRes, stationsRes] = await Promise.all([
          completedByIds.length > 0
            ? supabase.from('profiles').select('user_id, display_name').in('user_id', completedByIds)
            : Promise.resolve({ data: [] as any[] }),
          stationIds.length > 0
            ? supabase.from('stations').select('id, name, station_id').in('id', stationIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);

        const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.display_name]));
        const stationMap = new Map((stationsRes.data || []).map((s: any) => [s.id, { name: s.name, code: s.station_id }]));

        setRoutingSteps(data.map(step => ({
          ...step,
          completed_by_name: step.completed_by ? profileMap.get(step.completed_by) || null : null,
          station_name: step.station_id ? stationMap.get(step.station_id)?.name || null : null,
          station_code: step.station_id ? stationMap.get(step.station_id)?.code || null : null,
        })));
      } else {
        setRoutingSteps([]);
      }
    } catch {
      setRoutingSteps([]);
    } finally {
      setRoutingLoading(false);
    }
  };

  const loadComments = async () => {
    if (!item) return;
    const { data } = await getComments(item.id);
    setComments(data || []);
  };

  const loadHistory = async () => {
    if (!item) return;
    const { data } = await getHistory(item.id);
    setHistory(data || []);
  };

  const handleStatusChange = async (status: QueueStatus) => {
    if (!item) return;
    const updates: UpdateQueueItemInput = { status };
    
    // Track timestamps for workflow
    if (status === "in_progress" && !item.started_at) {
      updates.started_at = new Date().toISOString();
    } else if (status === "completed" && !item.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    
    const { error } = await onUpdate(item.id, updates);
    if (error) {
      // Parse DB trigger rejection messages for user-friendly display
      const friendlyError = error.includes("Invalid transition") || error.includes("Cannot transition")
        ? error
        : `Status change failed: ${error}`;
      toast({ title: "Transition Blocked", description: friendlyError, variant: "destructive" });
    } else {
      loadHistory();
    }
  };

  const handlePriorityChange = async (priority: QueuePriority) => {
    if (!item) return;
    const { error } = await onUpdate(item.id, { priority });
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      loadHistory();
    }
  };

  // Quick action: Start Work — respects state machine (pending → queued → in_progress)
  const handleStartWork = async () => {
    if (!item) return;
    setActionLoading("start");
    
    // If pending, must transition through queued first
    if (item.status === "pending") {
      const { error: queueError } = await onUpdate(item.id, { status: "queued" });
      if (queueError) {
        toast({ title: "Transition Blocked", description: queueError, variant: "destructive" });
        setActionLoading(null);
        return;
      }
    }
    
    const { error } = await onUpdate(item.id, { 
      status: "in_progress",
      started_at: new Date().toISOString()
    });
    setActionLoading(null);
    if (error) {
      toast({ title: "Transition Blocked", description: error, variant: "destructive" });
    } else {
      toast({ title: "Work Started", description: "Timer is now tracking this work order" });
      loadHistory();
    }
  };

  // Quick action: Pause/Hold
  const handlePauseWork = async () => {
    if (!item) return;
    setActionLoading("pause");
    const { error } = await onUpdate(item.id, { status: "on_hold" });
    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      loadHistory();
    }
  };

   // Quick action: Complete — routing-aware with pre-advance validation
  const handleCompleteWork = async () => {
    if (!item) return;
    setActionLoading("complete");

    // === Pre-advance validation ===
    const qtyCompleted = item.qty_completed ?? item.parts_completed ?? 0;
    const qtyOriginal = item.qty_original ?? item.quantity ?? 0;
    const qtyScrap = item.qty_scrap ?? 0;
    const qtyRework = item.qty_rework ?? 0;

    // 1. Parts completed vs required check
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

    // 2 & 3. Quality sign-off and first article checks via station state
    if (item.station_id) {
      const { data: stationStatus } = await supabase
        .from("current_station_status")
        .select("current_job_state")
        .eq("station_id", item.station_id)
        .maybeSingle();

      // Block if still waiting on QA
      if (stationStatus?.current_job_state === "Waiting on QA") {
        toast({
          title: "Quality Sign-off Required",
          description: "Station is still 'Waiting on QA'. QA must be resolved before advancing.",
          variant: "destructive",
        });
        setActionLoading(null);
        return;
      }

      // Block if first article not yet approved
      if (stationStatus?.current_job_state === "First Article in Process") {
        toast({
          title: "First Article Pending",
          description: "First article inspection must be completed and approved before advancing to next operation.",
          variant: "destructive",
        });
        setActionLoading(null);
        return;
      }
    }

    // Check if there are uncompleted routing steps after the current station
    const hasUncompletedSteps = routingSteps.length > 0 &&
      routingSteps.some(s => s.status !== "completed" && s.station_id !== item.station_id);

    const currentStepIdx = routingSteps.findIndex(
      s => s.station_id === item.station_id && s.status !== "completed"
    );
    const nextStep = currentStepIdx >= 0 ? routingSteps[currentStepIdx + 1] : null;

    if (nextStep) {
      // Mid-route: complete current step and advance
      try {
        if (currentStepIdx >= 0) {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase
            .from("work_order_routing")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              completed_by: user?.id,
            })
            .eq("id", routingSteps[currentStepIdx].id);
        }

        if (nextStep.station_id) {
          await supabase
            .from("queue_items")
            .update({
              status: "queued",
              station_id: nextStep.station_id,
              started_at: null,
            })
            .eq("id", item.id);

          await supabase
            .from("work_order_routing")
            .update({ status: "pending" })
            .eq("id", nextStep.id);

          // Update next station's dashboard status to show incoming work
          await supabase
            .from("current_station_status")
            .upsert(
              {
                station_id: nextStep.station_id,
                current_job_work_order: item.work_order || item.title,
                current_job_part_number: item.part_number,
                current_job_state: "Waiting on Material",
                current_operator_name: null,
                current_operator_id: null,
                parts_complete: 0,
                parts_required: item.quantity || 0,
              },
              { onConflict: "station_id" }
            );
        }

        // Clear current station status
        if (item.station_id) {
          await supabase
            .from("current_station_status")
            .update({
              current_job_work_order: null,
              current_job_part_number: null,
              current_job_state: null,
              current_operator_name: null,
              current_operator_id: null,
              parts_complete: null,
              parts_required: null,
            })
            .eq("station_id", item.station_id);
        }

        toast({
          title: "Operation Complete",
          description: `Advanced to ${nextStep.station_name || "next station"}`,
        });
        loadHistory();
        loadRouting();
      } catch {
        toast({ title: "Error", description: "Failed to advance work order", variant: "destructive" });
      }
    } else {
      // Final step or no routing — complete the work order
      const { error } = await onUpdate(item.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        toast({ title: "Work Order Completed!", description: "All operations finished" });
        loadHistory();
      }
    }
    setActionLoading(null);
  };

   // Navigate to create handoff for this work order
  const handleCreateHandoff = () => {
    // Store work order info in session for the handoff form to pick up
    if (item) {
      sessionStorage.setItem("handoff_prefill", JSON.stringify({
        work_order: item.work_order,
        part_number: item.part_number,
        operation_number: item.operation_number,
        station_id: item.station_id,
      }));
      sessionStorage.setItem("auto_open_handoff", "true");
    }
    onOpenChange(false);
    navigate("/dashboard");
  };

  const handleAddComment = async () => {
    if (!item || !newComment.trim()) return;
    setLoading(true);
    const { error } = await onAddComment(item.id, newComment.trim());
    setLoading(false);
    
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setNewComment("");
      loadComments();
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    const { error } = await onDelete(item.id);
    setDeleting(false);
    
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Queue item deleted" });
      onOpenChange(false);
    }
  };

  // Convert quote to work order
  const handleConvertToWorkOrder = async () => {
    if (!item) return;
    if (!convertWONumber.trim()) {
      toast({ title: "Error", description: "Please enter a work order number", variant: "destructive" });
      return;
    }
    setConverting(true);
    const { error } = await supabase
      .from("queue_items")
      .update({
        item_type: "work_order" as any,
        work_order: convertWONumber.trim(),
        station_id: convertStationId || item.station_id || null,
      })
      .eq("id", item.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quote Converted", description: `Now tracking as Work Order: ${convertWONumber}` });
      setConvertDialogOpen(false);
      setConvertWONumber("");
      setConvertStationId(undefined);
      loadHistory();
    }
    setConverting(false);
  };

  if (!item) return null;

  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== "completed";
  const isQuote = item.item_type === "quote";
  const isWorkOrder = item.item_type === "work_order";
  const canStart = item.status === "pending" || item.status === "queued";
  const canPause = item.status === "in_progress";
  const canComplete = item.status === "in_progress" || item.status === "on_hold";
  const isCompleted = item.status === "completed";

  // Calculate elapsed time if in progress
  const elapsedTime = item.started_at && !item.completed_at 
    ? formatDistanceToNow(new Date(item.started_at), { addSuffix: false })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className={cn(
          "rounded-t-lg -mx-6 -mt-6 px-6 pt-6 pb-4 mb-2",
          isQuote && "bg-amber-500/10 border-b border-amber-500/30",
          isWorkOrder && "bg-primary/5 border-b border-primary/20"
        )}>
          <div className="flex items-center gap-2 flex-wrap">
            {isQuote && <Badge className="bg-amber-500 text-white text-xs font-semibold px-3">QUOTE</Badge>}
            {isWorkOrder && <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3">WORK ORDER</Badge>}
            <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
            <Badge className={getStatusColor(item.status)}>{item.status.replace("_", " ")}</Badge>
            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
            {elapsedTime && (
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                Running: {elapsedTime}
              </Badge>
            )}
          </div>
          <DialogTitle className="flex items-center gap-2">
            {isQuote && <FileText className="w-5 h-5 text-amber-500" />}
            {isWorkOrder && <Package className="w-5 h-5 text-primary" />}
            {item.title}
          </DialogTitle>
          <DialogDescription>
            {isQuote ? "Quote" : isWorkOrder ? "Work Order" : "Item"} created {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            {item.work_order && (
              <span className="ml-2 font-medium">
                • {isQuote ? "Quote #" : "WO #"}: {item.work_order}
              </span>
            )}
            {assignedStation && (
              <span className="ml-2">
                • Station: <span className="font-medium">{assignedStation.station_id}</span> ({assignedStation.name})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Quick Action Buttons */}
        {isWorkOrder && !isCompleted && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
            {canStart && (
              <Button 
                onClick={handleStartWork} 
                disabled={actionLoading === "start"}
                className="gap-2"
              >
                {actionLoading === "start" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Start Work
              </Button>
            )}
            {canPause && (
              <Button 
                variant="outline" 
                onClick={handlePauseWork} 
                disabled={actionLoading === "pause"}
                className="gap-2"
              >
                {actionLoading === "pause" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                Pause
              </Button>
            )}
            {canComplete && (() => {
              const currentStepIdx = routingSteps.findIndex(
                s => s.station_id === item.station_id && s.status !== "completed"
              );
              const hasNextStep = currentStepIdx >= 0 && routingSteps[currentStepIdx + 1];
              return (
                <Button 
                  variant="default" 
                  onClick={handleCompleteWork} 
                  disabled={actionLoading === "complete"}
                  className={cn("gap-2", hasNextStep ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700")}
                >
                  {actionLoading === "complete" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : hasNextStep ? (
                    <ArrowRight className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {hasNextStep ? "Complete Operation" : (routingSteps.length > 0 ? "Complete Work Order" : "Complete")}
                </Button>
              );
            })()}
            <div className="flex-1" />
             {onOpenRouting && hasAdminAccess && (
              <Button 
                variant="outline" 
                onClick={() => onOpenRouting(item)}
                className="gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Edit Routing
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setNcrDialogOpen(true)}
              className="gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Report NCR
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCreateHandoff}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Create Handoff
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Quote Action Bar */}
        {isQuote && !isCompleted && (
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
                <Button 
                  variant="outline" 
                  onClick={() => onOpenRouting(item)}
                  className="gap-2"
                >
                  <GitBranch className="w-4 h-4" />
                  Edit Routing
                </Button>
              )}
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground self-center">
                {item.work_order && `Quote: ${item.work_order}`}
              </span>
            </div>

            {/* Convert to Work Order inline form */}
            {convertDialogOpen && (
              <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Convert Quote to Work Order
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Work Order Number</Label>
                    <Input
                      value={convertWONumber}
                      onChange={(e) => setConvertWONumber(e.target.value)}
                      placeholder="Enter work order number"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Assign Station (optional)</Label>
                    <Select
                      value={convertStationId || "none"}
                      onValueChange={(v) => setConvertStationId(v === "none" ? undefined : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select station..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No station (assign later)</SelectItem>
                        {stations.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.station_id} - {s.name}
                          </SelectItem>
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
                  <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {(isWorkOrder || isQuote) && item.qty_original != null && item.qty_original > 0 && (
          <QuantitySummaryCard
            original={item.qty_original ?? 0}
            completed={item.qty_completed ?? 0}
            scrap={item.qty_scrap ?? 0}
            rework={item.qty_rework ?? 0}
            open={item.qty_open ?? 0}
            locked={item.quantity_locked ?? false}
          />
        )}

        <div className="flex-1 overflow-hidden min-h-0">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="routing" className="gap-1" data-tour="routing-tab">
                <GitBranch className="w-4 h-4" />
                Routing
              </TabsTrigger>
              <TabsTrigger value="ncr" className="gap-1">
                <ShieldAlert className="w-4 h-4" />
                NCR ({ncrs.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-1">
                <MessageSquare className="w-4 h-4" />
                ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-auto mt-4 space-y-4">
              {/* Station Assignment */}
              {assignedStation && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <Wrench className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{assignedStation.station_id} - {assignedStation.name}</p>
                    <p className="text-sm text-muted-foreground">{assignedStation.work_center} • {assignedStation.work_center_type}</p>
                  </div>
                </div>
              )}

              {/* Status & Priority Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={item.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Current status */}
                      <SelectItem key={item.status} value={item.status}>
                        {statusOptions.find(o => o.value === item.status)?.label || item.status}
                      </SelectItem>
                      {/* Valid transitions only */}
                      {(VALID_TRANSITIONS[item.status] || []).map((targetStatus) => {
                        const option = statusOptions.find(o => o.value === targetStatus);
                        if (!option) return null;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select value={item.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Description */}
              {item.description && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              )}

              {/* Work Order Details */}
              {item.work_order && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Work Order</label>
                    <p className="font-medium">{item.work_order}</p>
                  </div>
                  {item.part_number && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Part Number</label>
                      <p className="font-medium">{item.part_number}</p>
                    </div>
                  )}
                  {item.operation_number && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Operation</label>
                      <p className="font-medium">{item.operation_number}</p>
                    </div>
                  )}
                  {item.quantity && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Quantity</label>
                      <p className="font-medium">{item.quantity}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ERP Source Info */}
              {item.erp_source && (
                <div className="flex items-center gap-3 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                  <Plug className="w-4 h-4 text-purple-500" />
                  <div className="text-sm">
                    <span className="font-medium">ERP Synced</span>
                    <span className="text-muted-foreground ml-2">Source: {item.erp_source}</span>
                    {item.erp_job_id && <span className="text-muted-foreground ml-2">· Job ID: <span className="font-mono">{item.erp_job_id}</span></span>}
                    {item.erp_last_synced_at && <span className="text-muted-foreground ml-2">· Synced {formatDistanceToNow(new Date(item.erp_last_synced_at), { addSuffix: true })}</span>}
                  </div>
                </div>
              )}

              {/* Part Specifications */}
              {(item.material_type || item.part_shape || item.part_length_inches || item.part_weight_lbs || (item as any).required_tolerance || (item as any).surface_finish) && (
                <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                  <label className="text-sm font-medium block">Part Specifications</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {item.material_type && (
                      <div>
                        <span className="text-xs text-muted-foreground block">Material</span>
                        <span className="font-medium">{item.material_type}</span>
                      </div>
                    )}
                    {item.part_shape && (
                      <div>
                        <span className="text-xs text-muted-foreground block">Shape</span>
                        <span className="font-medium capitalize">{item.part_shape}</span>
                      </div>
                    )}
                    {item.part_weight_lbs && (
                      <div>
                        <span className="text-xs text-muted-foreground block">Weight</span>
                        <span className="font-medium">{item.part_weight_lbs} lbs</span>
                      </div>
                    )}
                    {(item as any).required_tolerance && (
                      <div>
                        <span className="text-xs text-muted-foreground block">Tolerance</span>
                        <span className="font-medium">{(item as any).required_tolerance}</span>
                      </div>
                    )}
                    {(item as any).surface_finish && (
                      <div>
                        <span className="text-xs text-muted-foreground block">Surface Finish</span>
                        <span className="font-medium">{(item as any).surface_finish}</span>
                      </div>
                    )}
                  </div>
                  {(item.part_length_inches || item.part_width_inches || item.part_height_inches) && (
                    <div className="text-xs text-muted-foreground pt-1 border-t">
                      Dimensions: <strong>{item.part_length_inches ?? "—"} × {item.part_width_inches ?? "—"} × {item.part_height_inches ?? "—"} in</strong>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3">
                {item.due_date && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Due Date</label>
                    <div className={cn("flex items-center gap-1 text-sm", isOverdue && "text-red-600")}>
                      {isOverdue && <AlertTriangle className="w-4 h-4" />}
                      <Clock className="w-4 h-4" />
                      {format(new Date(item.due_date), "PPP")}
                    </div>
                  </div>
                )}
                {/* Machine Time Breakdown */}
                {(item.setup_time_minutes || item.first_article_minutes || item.cycle_time_minutes) ? (
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <label className="text-sm font-medium block">Machine Time Breakdown</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block">Setup</span>
                        <span className="font-medium">{item.setup_time_minutes || 0} min</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">First Article</span>
                        <span className="font-medium">{item.first_article_minutes || 0} min</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Cycle / Part</span>
                        <span className="font-medium">{item.cycle_time_minutes || 0} min/pc</span>
                      </div>
                    </div>
                    {item.estimated_duration && (
                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        Total: <strong>{item.estimated_duration} min</strong> (~{(item.estimated_duration / 60).toFixed(1)} hrs)
                        {item.quantity && item.cycle_time_minutes ? ` — includes ${item.cycle_time_minutes} min × ${item.quantity} pcs` : ''}
                      </div>
                    )}
                  </div>
                ) : item.estimated_duration ? (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Estimated Duration</label>
                    <p className="text-sm">{item.estimated_duration} minutes</p>
                  </div>
                ) : null}
              </div>

              {/* Started/Completed Times */}
              {(item.started_at || item.completed_at) && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  {item.started_at && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Started</label>
                      <p className="text-sm font-medium">{format(new Date(item.started_at), "PPp")}</p>
                    </div>
                  )}
                  {item.completed_at && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Completed</label>
                      <p className="text-sm font-medium">{format(new Date(item.completed_at), "PPp")}</p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Delete Action */}
              <div className="pt-4">
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Item
                </Button>
              </div>
            </TabsContent>

            {/* Routing Steps Tab */}
            <TabsContent value="routing" className="flex-1 overflow-auto mt-4">
              {routingLoading ? (
                <div className="space-y-3 py-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : routingSteps.length === 0 ? (
                <div className="py-6 space-y-4">
                  <div className="text-center space-y-3">
                    <GitBranch className="w-10 h-10 mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground">No routing steps configured yet.</p>
                  </div>

                  {!addingRouting ? (
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setAddingRouting(true); setNewRoutingSteps([]); }} className="gap-2">
                        <GitBranch className="w-4 h-4" />
                        Add Routing
                      </Button>
                      {onOpenRouting && hasAdminAccess && (
                        <Button variant="outline" size="sm" onClick={() => onOpenRouting(item)} className="gap-2">
                          <GitBranch className="w-4 h-4" />
                          Advanced Editor
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <RoutingSection
                        steps={newRoutingSteps}
                        onChange={setNewRoutingSteps}
                        stations={stations.map(s => ({ id: s.id, name: s.name, station_id: s.station_id, work_center_type: s.work_center_type || '' }))}
                      />
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setAddingRouting(false); setNewRoutingSteps([]); }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={savingRouting || newRoutingSteps.length === 0 || newRoutingSteps.some(s => !s.operation_name.trim())}
                          className="gap-2"
                          onClick={async () => {
                            if (!item || !organization?.id) return;
                            setSavingRouting(true);
                            try {
                              const routingRows = newRoutingSteps.map((step) => ({
                                queue_item_id: item.id,
                                organization_id: organization.id,
                                step_number: step.step_number,
                                operation_name: step.operation_name,
                                operation_type: step.operation_type,
                                station_id: step.station_id || null,
                                setup_time_minutes: step.setup_time_minutes || null,
                                first_article_minutes: step.first_article_minutes || null,
                                cycle_time_minutes: step.cycle_time_minutes || null,
                                notes: step.notes || null,
                                outside_vendor: step.outside_vendor || null,
                                po_number: step.po_number || null,
                                expected_return_date: step.expected_return_date || null,
                                status: "pending",
                              }));

                              const { error: routingError } = await supabase
                                .from("work_order_routing")
                                .insert(routingRows);

                              if (routingError) throw routingError;

                              // Update the WO's station_id to the first step's station
                              const firstStationId = newRoutingSteps[0]?.station_id;
                              if (firstStationId) {
                                await supabase
                                  .from("queue_items")
                                  .update({ station_id: firstStationId })
                                  .eq("id", item.id);
                              }

                              toast({ title: "Routing Saved", description: `${newRoutingSteps.length} routing step(s) added to this work order.` });
                              setAddingRouting(false);
                              setNewRoutingSteps([]);
                              loadRouting();
                            } catch (err: any) {
                              toast({ title: "Error", description: err.message || "Failed to save routing", variant: "destructive" });
                            } finally {
                              setSavingRouting(false);
                            }
                          }}
                        >
                          {savingRouting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Routing
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-1">
                    {routingSteps.map((step, idx) => {
                      const isComplete = step.status === 'completed';
                      const isActive = step.status === 'in_progress';
                      const isPending = step.status === 'pending';
                      const isOutside = step.operation_type === 'outside_processing';

                      return (
                        <div key={step.id} className="relative">
                          {/* Connector line */}
                          {idx < routingSteps.length - 1 && (
                            <div className={cn(
                              "absolute left-[15px] top-[32px] bottom-0 w-0.5",
                              isComplete ? "bg-green-400" : "bg-border"
                            )} />
                          )}
                          <div className={cn(
                            "flex items-start gap-3 p-3 rounded-lg transition-colors",
                            isActive && "bg-primary/5 border border-primary/20",
                            isOutside && !isActive && "bg-amber-500/5",
                          )}>
                            {/* Status icon */}
                            <div className="mt-0.5">
                              {isComplete ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : isActive ? (
                                <CircleDot className="w-5 h-5 text-primary animate-pulse" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground/40" />
                              )}
                            </div>

                            {/* Step info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "font-medium text-sm",
                                  isPending && "text-muted-foreground"
                                )}>
                                  {step.step_number}. {step.operation_name}
                                </span>
                                {isOutside && (
                                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
                                    <Truck className="w-3 h-3 mr-1" />
                                    Outside
                                  </Badge>
                                )}
                                {isActive && (
                                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                                    In Progress
                                  </Badge>
                                )}
                              </div>

                              {/* Station assignment */}
                              {step.station_name && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  <Wrench className="w-3 h-3 inline mr-1" />
                                  {step.station_code} - {step.station_name}
                                </p>
                              )}

                              {/* Outside vendor info */}
                              {isOutside && step.outside_vendor && (
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                  Vendor: {step.outside_vendor}
                                  {step.po_number && ` • PO: ${step.po_number}`}
                                  {step.expected_return_date && ` • Return: ${format(new Date(step.expected_return_date), "MMM d, yyyy")}`}
                                </p>
                              )}

                              {/* Completion info - who signed off */}
                              {isComplete && (
                                <div className="flex items-center gap-2 mt-1 text-xs text-green-700 dark:text-green-400">
                                  <User className="w-3 h-3" />
                                  <span>
                                    {step.completed_by_name || "System"} signed off
                                    {step.completed_at && ` • ${format(new Date(step.completed_at), "MMM d, h:mm a")}`}
                                  </span>
                                </div>
                              )}

                              {/* Duration */}
                              {step.estimated_duration && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  <Timer className="w-3 h-3 inline mr-1" />
                                  Est. {step.estimated_duration} min
                                </p>
                              )}

                              {/* Notes */}
                              {step.notes && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  {step.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Edit Routing button at bottom */}
                  {onOpenRouting && hasAdminAccess && (
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => onOpenRouting(item)} className="gap-2">
                        <GitBranch className="w-4 h-4" />
                        Edit Routing
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            {/* NCR Tab */}
            <TabsContent value="ncr" className="flex-1 overflow-auto mt-4">
              <NCRListView ncrs={ncrs} />
              {ncrs.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <ShieldAlert className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <p className="text-muted-foreground">No NCRs reported for this work order.</p>
                  <Button variant="outline" size="sm" onClick={() => setNcrDialogOpen(true)} className="gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Report NCR
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="flex-1 flex flex-col overflow-hidden mt-4">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{comment.user_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No comments yet</p>
                  )}
                </div>
              </ScrollArea>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-auto mt-4">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p>
                          <span className="font-medium">{entry.user_name}</span>{" "}
                          {entry.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No history yet</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* NCR Create Dialog */}
        {item && (
          <CreateNCRDialog
            open={ncrDialogOpen}
            onOpenChange={setNcrDialogOpen}
            workOrderNumber={item.work_order || ''}
            partNumber={item.part_number}
            queueItemId={item.id}
            qtyOpen={item.qty_open ?? item.quantity ?? 0}
            onUploadImage={uploadNCRImage}
            onSubmit={createNCR}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
