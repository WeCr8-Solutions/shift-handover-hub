import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { QueueItem, QueueItemComment, QueueItemHistory, QueueStatus, QueuePriority, UpdateQueueItemInput } from "@/hooks/useQueue";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, User, Package, Send, History, MessageSquare, Trash2, Loader2 } from "lucide-react";

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
    case "pending": return "bg-gray-100 text-gray-800";
    case "queued": return "bg-yellow-100 text-yellow-800";
    case "in_progress": return "bg-blue-100 text-blue-800";
    case "on_hold": return "bg-orange-100 text-orange-800";
    case "completed": return "bg-green-100 text-green-800";
    case "cancelled": return "bg-red-100 text-red-800";
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
  const { toast } = useToast();
  const [comments, setComments] = useState<QueueItemComment[]>([]);
  const [history, setHistory] = useState<QueueItemHistory[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    const { error } = await onUpdate(item.id, { status });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
            <Badge className={getStatusColor(item.status)}>{item.status.replace("_", " ")}</Badge>
            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
          </div>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>
            Created {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

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
              {/* Quick Actions */}
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Work Order</label>
                    <div className="flex items-center gap-1 text-sm">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      {item.work_order}
                    </div>
                  </div>
                  {item.part_number && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">Part Number</label>
                      <p className="text-sm">{item.part_number}</p>
                    </div>
                  )}
                  {item.quantity && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">Quantity</label>
                      <p className="text-sm">{item.quantity}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {item.due_date && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Due Date</label>
                    <div className={cn("flex items-center gap-1 text-sm", isOverdue && "text-red-600")}>
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
