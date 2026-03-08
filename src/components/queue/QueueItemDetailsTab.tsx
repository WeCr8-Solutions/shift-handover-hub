import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { QueueItem, QueueStatus, QueuePriority, UpdateQueueItemInput } from "@/hooks/useQueue";
import { Station } from "@/hooks/useStations";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Wrench, AlertTriangle, Plug, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { PartImageSection } from "@/components/queue/PartImageSection";

const statusOptions: { value: QueueStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

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

interface QueueItemDetailsTabProps {
  item: QueueItem;
  assignedStation: Station | null;
  isOverdue: boolean;
  onUpdate: (id: string, input: UpdateQueueItemInput) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
  onReloadHistory: () => void;
  onCloseDialog: () => void;
}

export function QueueItemDetailsTab({
  item,
  assignedStation,
  isOverdue,
  onUpdate,
  onDelete,
  onReloadHistory,
  onCloseDialog,
}: QueueItemDetailsTabProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (status: QueueStatus) => {
    const updates: UpdateQueueItemInput = { status };
    if (status === "in_progress" && !item.started_at) {
      updates.started_at = new Date().toISOString();
    } else if (status === "completed" && !item.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    const { error } = await onUpdate(item.id, updates);
    if (error) {
      const friendlyError = error.includes("Invalid transition") || error.includes("Cannot transition") ? error : `Status change failed: ${error}`;
      toast({ title: "Transition Blocked", description: friendlyError, variant: "destructive" });
    } else {
      onReloadHistory();
    }
  };

  const handlePriorityChange = async (priority: QueuePriority) => {
    const { error } = await onUpdate(item.id, { priority });
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      onReloadHistory();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await onDelete(item.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Queue item deleted" });
      onCloseDialog();
    }
  };

  return (
    <div className="space-y-4">
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
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem key={item.status} value={item.status}>
                {statusOptions.find(o => o.value === item.status)?.label || item.status}
              </SelectItem>
              {(VALID_TRANSITIONS[item.status] || []).map((targetStatus) => {
                const option = statusOptions.find(o => o.value === targetStatus);
                if (!option) return null;
                return <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <Select value={item.priority} onValueChange={handlePriorityChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
        {item.work_order && (
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Work Order</label>
            <p className="font-medium">{item.work_order}</p>
          </div>
        )}
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
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Item Type</label>
          <p className="font-medium capitalize">{item.item_type.replace("_", " ")}</p>
        </div>
      </div>

      {/* Quantity Breakdown */}
      {(item.quantity || item.qty_original) && (
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          <label className="text-sm font-medium block">Quantity Breakdown</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Original</span>
              <span className="font-medium">{item.qty_original ?? item.quantity ?? 0}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Completed</span>
              <span className="font-medium text-green-600 dark:text-green-400">{item.qty_completed ?? 0}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Scrap</span>
              <span className="font-medium text-red-600 dark:text-red-400">{item.qty_scrap ?? 0}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Rework</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{item.qty_rework ?? 0}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Open</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{item.qty_open ?? 0}</span>
            </div>
          </div>
          {item.quantity_locked && (
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium pt-1 border-t border-border">
              🔒 Quantity locked — all parts accounted for
            </div>
          )}
        </div>
      )}

      {/* Rework / Parent WO context */}
      {item.is_rework && item.parent_work_order_id && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 text-sm">
          <Wrench className="w-4 h-4 text-amber-500" />
          <span className="font-medium text-amber-700 dark:text-amber-300">Rework Order</span>
          <span className="text-muted-foreground">— linked to parent work order</span>
        </div>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Tags</label>
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {tag}
              </span>
            ))}
          </div>
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
          </div>
        </div>
      )}

      {/* Material & Part Specs */}
      {(item.material_type || item.part_weight_lbs || (item as any).required_tolerance || (item as any).surface_finish) && (
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          <label className="text-sm font-medium block">Material & Part Specs</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {item.material_type && (
              <div>
                <span className="text-xs text-muted-foreground block">Material</span>
                <span className="font-medium">{item.material_type}</span>
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

      {/* Due Date & Machine Time */}
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
    </div>
  );
}
