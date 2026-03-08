import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useIssueDetail } from "@/hooks/useIssueDetail";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bug,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  User,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ExternalLink,
  Timer,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ConsoleLogViewer } from "./ConsoleLogViewer";
import { ErrorStackTrace } from "./ErrorStackTrace";
import { EnvironmentContext } from "./EnvironmentContext";

interface DevQueueItem {
  id: string;
  issue_id: string;
  assigned_developer_id: string | null;
  assigned_developer_name: string | null;
  priority: number;
  queue_position: number;
  estimated_effort: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  time_spent_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  issue: {
    id: string;
    title: string;
    description: string | null;
    severity: string;
    status: string;
    reporter_display_name: string | null;
    reporter_email: string | null;
    page_url: string | null;
    error_message: string | null;
    created_at: string;
  };
}

const priorityColors: Record<number, string> = {
  5: "bg-red-500",
  4: "bg-orange-500",
  3: "bg-yellow-500",
  2: "bg-blue-500",
  1: "bg-gray-500",
};

const priorityLabels: Record<number, string> = {
  5: "Critical",
  4: "High",
  3: "Medium",
  2: "Low",
  1: "Trivial",
};

const statusColors: Record<string, string> = {
  queued: "bg-gray-500",
  in_progress: "bg-blue-500",
  blocked: "bg-red-500",
  completed: "bg-green-500",
  deferred: "bg-yellow-500",
};

const effortLabels: Record<string, string> = {
  quick_fix: "⚡ Quick Fix",
  medium: "🔧 Medium",
  complex: "🏗️ Complex",
};

export function DevIssueQueue() {
  const { user } = useAuth();
  const [queueItems, setQueueItems] = useState<DevQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DevQueueItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("active");
  const [notes, setNotes] = useState("");

  // Lazy-fetch full diagnostic data only when detail dialog is open
  const { issue: issueDetail, loading: detailLoading } = useIssueDetail(
    detailOpen && selectedItem ? selectedItem.issue_id : null
  );

  const fetchQueue = async () => {
    try {
      let query = supabase
        .from("dev_issue_queue")
        .select(`
          *,
          issue:issues!inner (
            id,
            title,
            description,
            severity,
            status,
            reporter_display_name,
            reporter_email,
            page_url,
            error_message,
            created_at
          )
        `)
        .order("priority", { ascending: false })
        .order("queue_position", { ascending: true });

      if (filter === "active") {
        query = query.in("status", ["queued", "in_progress", "blocked"]);
      } else if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQueueItems((data as unknown as DevQueueItem[]) || []);
    } catch (error) {
      console.error("Failed to fetch dev queue:", error);
      toast({
        title: "Error loading queue",
        description: "Could not load the developer issue queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const claimIssue = async (item: DevQueueItem) => {
    if (!user) return;
    setUpdating(item.id);

    try {
      const { error } = await supabase
        .from("dev_issue_queue")
        .update({
          assigned_developer_id: user.id,
          assigned_developer_name: user.email?.split("@")[0] || "Developer",
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      toast({ title: "Issue claimed", description: "You are now working on this issue" });
      fetchQueue();
    } catch (error) {
      console.error("Failed to claim issue:", error);
      toast({ title: "Error", description: "Could not claim issue", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const updateStatus = async (item: DevQueueItem, newStatus: string) => {
    setUpdating(item.id);

    try {
      const updates: Record<string, unknown> = { status: newStatus };

      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
        if (item.started_at) {
          const startTime = new Date(item.started_at).getTime();
          const now = Date.now();
          updates.time_spent_minutes = Math.round((now - startTime) / 60000);
        }
      } else if (newStatus === "in_progress" && !item.started_at) {
        updates.started_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("dev_issue_queue")
        .update(updates)
        .eq("id", item.id);

      if (error) throw error;

      // Also update the issue status if completed
      if (newStatus === "completed") {
        await supabase
          .from("issues")
          .update({ status: "resolved", resolved_at: new Date().toISOString() })
          .eq("id", item.issue_id);
      }

      toast({ title: "Status updated" });
      fetchQueue();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({ title: "Error", description: "Could not update status", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const updateEffort = async (item: DevQueueItem, effort: string) => {
    setUpdating(item.id);

    try {
      const { error } = await supabase
        .from("dev_issue_queue")
        .update({ estimated_effort: effort })
        .eq("id", item.id);

      if (error) throw error;
      fetchQueue();
    } catch (error) {
      console.error("Failed to update effort:", error);
    } finally {
      setUpdating(null);
    }
  };

  const updatePriority = async (item: DevQueueItem, direction: "up" | "down") => {
    const newPriority = direction === "up" 
      ? Math.min(item.priority + 1, 5)
      : Math.max(item.priority - 1, 1);

    if (newPriority === item.priority) return;
    setUpdating(item.id);

    try {
      const { error } = await supabase
        .from("dev_issue_queue")
        .update({ priority: newPriority })
        .eq("id", item.id);

      if (error) throw error;
      fetchQueue();
    } catch (error) {
      console.error("Failed to update priority:", error);
    } finally {
      setUpdating(null);
    }
  };

  const saveNotes = async () => {
    if (!selectedItem) return;
    setUpdating(selectedItem.id);

    try {
      const { error } = await supabase
        .from("dev_issue_queue")
        .update({ notes })
        .eq("id", selectedItem.id);

      if (error) throw error;

      toast({ title: "Notes saved" });
      setDetailOpen(false);
      fetchQueue();
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast({ title: "Error", description: "Could not save notes", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const openDetail = (item: DevQueueItem) => {
    setSelectedItem(item);
    setNotes(item.notes || "");
    setDetailOpen(true);
  };

  const stats = {
    queued: queueItems.filter((i) => i.status === "queued").length,
    inProgress: queueItems.filter((i) => i.status === "in_progress").length,
    blocked: queueItems.filter((i) => i.status === "blocked").length,
    completed: queueItems.filter((i) => i.status === "completed").length,
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Developer Issue Queue
            </CardTitle>
            <CardDescription>
              Track and resolve reported issues
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchQueue()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-sm text-muted-foreground">
              Queued: <strong>{stats.queued}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-muted-foreground">
              In Progress: <strong>{stats.inProgress}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">
              Blocked: <strong>{stats.blocked}</strong>
            </span>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Issues</SelectItem>
              <SelectItem value="queued">Queued Only</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="all">All Issues</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {queueItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bug className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No issues in queue</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Pri</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-32">Effort</TableHead>
                  <TableHead className="w-32">Assigned</TableHead>
                  <TableHead className="w-24">Time</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueItems.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetail(item)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => updatePriority(item, "up")}
                          disabled={item.priority >= 5}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Badge className={`${priorityColors[item.priority]} text-white text-xs`}>
                          {item.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => updatePriority(item, "down")}
                          disabled={item.priority <= 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium line-clamp-1">{item.issue.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {item.issue.severity}
                          </Badge>
                          {item.issue.reporter_display_name && (
                            <span>by {item.issue.reporter_display_name}</span>
                          )}
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={item.status}
                        onValueChange={(v) => updateStatus(item, v)}
                        disabled={updating === item.id}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusColors[item.status]}`} />
                            <span className="text-xs capitalize">{item.status.replace("_", " ")}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="queued">Queued</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="deferred">Deferred</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={item.estimated_effort || ""}
                        onValueChange={(v) => updateEffort(item, v)}
                        disabled={updating === item.id}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="Estimate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quick_fix">{effortLabels.quick_fix}</SelectItem>
                          <SelectItem value="medium">{effortLabels.medium}</SelectItem>
                          <SelectItem value="complex">{effortLabels.complex}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      {item.assigned_developer_name ? (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-20">{item.assigned_developer_name}</span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            claimIssue(item);
                          }}
                          disabled={updating === item.id}
                        >
                          {updating === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Claim"
                          )}
                        </Button>
                      )}
                    </TableCell>

                    <TableCell>
                      {item.time_spent_minutes ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Timer className="w-3 h-3" />
                          <span>{item.time_spent_minutes}m</span>
                        </div>
                      ) : item.started_at ? (
                        <div className="flex items-center gap-1 text-sm text-blue-500">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {item.status === "queued" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateStatus(item, "in_progress")}
                            disabled={updating === item.id}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                        {item.status === "in_progress" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateStatus(item, "blocked")}
                              disabled={updating === item.id}
                            >
                              <Pause className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600"
                              onClick={() => updateStatus(item, "completed")}
                              disabled={updating === item.id}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {item.status === "blocked" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateStatus(item, "in_progress")}
                            disabled={updating === item.id}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                        {item.issue.page_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(item.issue.page_url!, "_blank")}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={`${priorityColors[selectedItem?.priority || 3]} text-white`}>
                P{selectedItem?.priority}
              </Badge>
              {selectedItem?.issue.title}
            </DialogTitle>
            <DialogDescription>
              Reported {selectedItem && formatDistanceToNow(new Date(selectedItem.created_at), { addSuffix: true })}
              {selectedItem?.issue.reporter_display_name && ` by ${selectedItem.issue.reporter_display_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedItem?.issue.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedItem.issue.description}</p>
              </div>
            )}

            {selectedItem?.issue.error_message && (
              <div>
                <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Error
                </h4>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {selectedItem.issue.error_message}
                </pre>
              </div>
            )}

            {selectedItem?.issue.page_url && (
              <div>
                <h4 className="text-sm font-medium mb-1">Page URL</h4>
                <a 
                  href={selectedItem.issue.page_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {selectedItem.issue.page_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-1">Developer Notes</h4>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this issue, steps to reproduce, root cause, fix details..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNotes} disabled={updating === selectedItem?.id}>
              {updating === selectedItem?.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
