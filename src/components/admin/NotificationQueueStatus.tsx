import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Bell, RefreshCw, Play, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

interface QueueItem {
  id: string;
  notification_type: string;
  channel: string;
  recipient: string;
  subject: string | null;
  priority: string | null;
  status: string;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

const statusConfig: Record<string, { color: string; Icon: typeof Clock }> = {
  pending: { color: "bg-yellow-500", Icon: Clock },
  processing: { color: "bg-blue-500", Icon: Loader2 },
  sent: { color: "bg-green-500", Icon: CheckCircle2 },
  failed: { color: "bg-destructive", Icon: XCircle },
};

export function NotificationQueueStatus() {
  const [stats, setStats] = useState<QueueStats>({ pending: 0, processing: 0, sent: 0, failed: 0 });
  const [recentItems, setRecentItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch counts by status
      const { data: allItems, error } = await supabase
        .from("notification_queue")
        .select("id, status")
        .limit(1000);

      if (error) throw error;

      const counts: QueueStats = { pending: 0, processing: 0, sent: 0, failed: 0 };
      (allItems || []).forEach((item) => {
        const s = item.status as keyof QueueStats;
        if (s in counts) counts[s]++;
      });
      setStats(counts);

      // Fetch recent items for detail view
      const { data: recent, error: recentError } = await supabase
        .from("notification_queue")
        .select("id, notification_type, channel, recipient, subject, priority, status, attempts, max_attempts, error_message, sent_at, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (recentError) throw recentError;
      setRecentItems((recent as QueueItem[]) || []);
    } catch (err) {
      console.error("Failed to fetch notification queue:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const processQueue = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-notifications");

      if (error) throw error;

      toast({
        title: "Queue processed",
        description: `Sent: ${data?.sent || 0}, Failed: ${data?.failed || 0}`,
      });
      fetchData();
    } catch (err) {
      console.error("Failed to process queue:", err);
      toast({
        title: "Processing failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
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
              <Bell className="w-5 h-5" />
              Notification Queue
            </CardTitle>
            <CardDescription>
              Email notification delivery status and processing
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={processQueue}
              disabled={processing || stats.pending === 0}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Process ({stats.pending})
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 mt-3 flex-wrap">
          {(Object.entries(stats) as [keyof QueueStats, number][]).map(([status, count]) => {
            const config = statusConfig[status];
            return (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${config?.color || "bg-muted"}`} />
                <span className="text-sm text-muted-foreground capitalize">
                  {status}: <strong>{count}</strong>
                </span>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        {recentItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>No notifications in queue</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead className="w-20">Attempts</TableHead>
                  <TableHead className="w-28">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentItems.map((item) => {
                  const config = statusConfig[item.status];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs gap-1 capitalize"
                        >
                          <div className={`w-2 h-2 rounded-full ${config?.color || "bg-muted"}`} />
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.notification_type.replace(/_/g, " ")}</div>
                        {item.error_message && (
                          <div className="text-xs text-destructive truncate max-w-[200px]">
                            {item.error_message}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[150px] block">{item.recipient}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.attempts}/{item.max_attempts}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {item.sent_at
                            ? formatDistanceToNow(new Date(item.sent_at), { addSuffix: true })
                            : formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
