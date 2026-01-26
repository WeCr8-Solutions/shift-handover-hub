import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { QueueItem, QueueItemComment, QueueItemHistory, QueueStatus, QueuePriority, UpdateQueueItemInput } from "@/hooks/useQueue";
import { useStations } from "@/hooks/useStations";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Clock, User, Package, Send, History, MessageSquare, Trash2, Loader2,
  Play, Pause, CheckCircle2, Wrench, FileText, AlertTriangle, ArrowRight
} from "lucide-react";

interface QueueItemDetailDialogProps {
  item: QueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, input: UpdateQueueItemInput) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
  onAddComment: (itemId: string, content: string) => Promise<{ error: string | null }>;
  getComments: (itemId: string) => Promise<{ data: QueueItemComment[] | null; error: string | null }>;
  getHistory: (itemId: string) => Promise<{ data: QueueItemHistory[] | null; error: string | null }>;
}

const statusOptions: { value: QueueStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

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
}: QueueItemDetailDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentTeam } = useCurrentTeam();
  const { stations } = useStations(currentTeam?.id);
  const [comments, setComments] = useState<QueueItemComment[]>([]);
  const [history, setHistory] = useState<QueueItemHistory[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Get station info if assigned
  const assignedStation = item?.station_id ? stations.find(s => s.id === item.station_id) : null;

  useEffect(() => {
    if (item && open) {
      loadComments();
      loadHistory();
    }
  }, [item, open]);

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
      toast({ title: "Error", description: error, variant: "destructive" });
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

  // Quick action: Start Work
  const handleStartWork = async () => {
    if (!item) return;
    setActionLoading("start");
    const { error } = await onUpdate(item.id, { 
      status: "in_progress",
      started_at: new Date().toISOString()
    });
    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
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

  // Quick action: Complete
  const handleCompleteWork = async () => {
    if (!item) return;
    setActionLoading("complete");
    const { error } = await onUpdate(item.id, { 
      status: "completed",
      completed_at: new Date().toISOString()
    });
    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Completed!", description: "Work order marked as complete" });
      loadHistory();
    }
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
    }
    onOpenChange(false);
    navigate("/");
    // Trigger handoff form open (would need to emit an event or use state)
    toast({ title: "Ready", description: "Open New Handoff to complete the shift handoff" });
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

  if (!item) return null;

  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== "completed";
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
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
            {isWorkOrder && <Package className="w-5 h-5 text-primary" />}
            {item.title}
          </DialogTitle>
          <DialogDescription>
            Created {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            {assignedStation && (
              <span className="ml-2">
                • Assigned to <span className="font-medium">{assignedStation.station_id}</span> ({assignedStation.name})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Quick Action Buttons */}
        {isWorkOrder && !isCompleted && (
          <div className="flex gap-2 p-3 bg-muted/30 rounded-lg border">
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
            {canComplete && (
              <Button 
                variant="default" 
                onClick={handleCompleteWork} 
                disabled={actionLoading === "complete"}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {actionLoading === "complete" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Complete
              </Button>
            )}
            <div className="flex-1" />
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

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="comments" className="gap-1">
                <MessageSquare className="w-4 h-4" />
                Comments ({comments.length})
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
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
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
                <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
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

              {/* Timing Info */}
              <div className="grid grid-cols-2 gap-4">
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
                {item.estimated_duration && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Estimated Duration</label>
                    <p className="text-sm">{item.estimated_duration} minutes</p>
                  </div>
                )}
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

            <TabsContent value="comments" className="flex-1 flex flex-col overflow-hidden mt-4">
              <ScrollArea className="flex-1 pr-4">
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
      </DialogContent>
    </Dialog>
  );
}
