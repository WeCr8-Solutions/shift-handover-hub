import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/hooks/useActivityLog";
import { useAdminAccess } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  LogIn, 
  LogOut, 
  UserPlus, 
  FileText, 
  Edit, 
  Plus, 
  Trash2, 
  Users, 
  Settings,
  RefreshCw,
  Loader2,
  Filter,
  Shield,
  ShieldCheck
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Type for activity log entries (works for both table and views)
interface ActivityLogEntry {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  description: string;
  user_display_name: string | null;
  user_email?: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
}

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  login: LogIn,
  logout: LogOut,
  signup: UserPlus,
  handoff_created: FileText,
  handoff_updated: Edit,
  station_created: Plus,
  station_updated: Edit,
  station_deleted: Trash2,
  team_created: Users,
  team_updated: Edit,
  team_deleted: Trash2,
  user_role_changed: Settings,
  team_member_added: UserPlus,
  team_member_removed: Trash2,
  profile_updated: Edit,
  ncr_created: FileText,
  ncr_approved: ShieldCheck,
  ncr_rejected: Shield,
  quantity_override: Edit,
  rework_wo_created: Plus,
  work_order_quantity_adjusted: Edit,
  us_person_declaration: ShieldCheck,
};

const activityColors: Record<ActivityType, string> = {
  login: "bg-green-500/10 text-green-500",
  logout: "bg-gray-500/10 text-gray-500",
  signup: "bg-blue-500/10 text-blue-500",
  handoff_created: "bg-primary/10 text-primary",
  handoff_updated: "bg-yellow-500/10 text-yellow-500",
  station_created: "bg-emerald-500/10 text-emerald-500",
  station_updated: "bg-amber-500/10 text-amber-500",
  station_deleted: "bg-red-500/10 text-red-500",
  team_created: "bg-indigo-500/10 text-indigo-500",
  team_updated: "bg-orange-500/10 text-orange-500",
  team_deleted: "bg-red-500/10 text-red-500",
  user_role_changed: "bg-purple-500/10 text-purple-500",
  team_member_added: "bg-teal-500/10 text-teal-500",
  team_member_removed: "bg-rose-500/10 text-rose-500",
  profile_updated: "bg-cyan-500/10 text-cyan-500",
  ncr_created: "bg-amber-500/10 text-amber-500",
  ncr_approved: "bg-green-500/10 text-green-500",
  ncr_rejected: "bg-red-500/10 text-red-500",
  quantity_override: "bg-purple-500/10 text-purple-500",
  rework_wo_created: "bg-indigo-500/10 text-indigo-500",
  work_order_quantity_adjusted: "bg-orange-500/10 text-orange-500",
  us_person_declaration: "bg-amber-500/10 text-amber-600",
};

const activityLabels: Record<ActivityType, string> = {
  login: "Login",
  logout: "Logout",
  signup: "Sign Up",
  handoff_created: "Handoff Created",
  handoff_updated: "Handoff Updated",
  station_created: "Station Created",
  station_updated: "Station Updated",
  station_deleted: "Station Deleted",
  team_created: "Team Created",
  team_updated: "Team Updated",
  team_deleted: "Team Deleted",
  user_role_changed: "Role Changed",
  team_member_added: "Member Added",
  team_member_removed: "Member Removed",
  profile_updated: "Profile Updated",
  ncr_created: "NCR Created",
  ncr_approved: "NCR Approved",
  ncr_rejected: "NCR Rejected",
  quantity_override: "Quantity Override",
  rework_wo_created: "Rework WO Created",
  work_order_quantity_adjusted: "WO Qty Adjusted",
  us_person_declaration: "US Person Certified",
};

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityType | "all">("all");
  const { isAdmin, isDeveloper } = useAdminAccess();
  const hasFullAccess = isAdmin || isDeveloper;

  const fetchLogs = async () => {
    setLoading(true);
    
    try {
      let data: ActivityLogEntry[] = [];
      let error: Error | null = null;
      
      if (hasFullAccess) {
        // Platform admins use the full activity_logs table (includes IP addresses)
        const result = await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        
        if (filter !== "all" && result.data) {
          data = result.data.filter(log => log.activity_type === filter) as ActivityLogEntry[];
        } else {
          data = (result.data || []) as ActivityLogEntry[];
        }
        error = result.error;
      } else {
        // Org admins use the activity_logs_org_admin view (excludes IP addresses for privacy)
        const result = await supabase
          .from("activity_logs_org_admin")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        
        if (filter !== "all" && result.data) {
          data = result.data.filter(log => log.activity_type === filter) as ActivityLogEntry[];
        } else {
          data = (result.data || []) as ActivityLogEntry[];
        }
        error = result.error;
      }

      if (error) {
        console.error("Error fetching activity logs:", error);
      } else {
        setLogs(data);
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filter, hasFullAccess]);

  // Subscribe to realtime updates (only for main table, platform admins)
  useEffect(() => {
    if (!hasFullAccess) return; // Views don't support realtime
    
    const channel = supabase
      .channel("activity_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
        },
        (payload) => {
          const newLog = payload.new as ActivityLogEntry;
          if (filter === "all" || newLog.activity_type === filter) {
            setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const activityTypes: ActivityType[] = [
    "login",
    "logout",
    "signup",
    "handoff_created",
    "handoff_updated",
    "station_created",
    "station_updated",
    "station_deleted",
    "team_created",
    "team_updated",
    "team_deleted",
    "user_role_changed",
    "team_member_added",
    "team_member_removed",
    "profile_updated",
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Activity Logs</CardTitle>
          {hasFullAccess ? (
            <Badge variant="outline" className="gap-1 text-xs bg-primary/10 text-primary border-primary/30">
              <ShieldCheck className="w-3 h-3" />
              Full Access
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs">
              <Shield className="w-3 h-3" />
              Org View
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as ActivityType | "all")}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              {activityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {activityLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No activity logs found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {logs.map((log) => {
                const Icon = activityIcons[log.activity_type] || Activity;
                const colorClass = activityColors[log.activity_type] || "bg-gray-500/10 text-gray-500";
                
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {log.user_display_name || log.user_email || "Unknown User"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {activityLabels[log.activity_type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {log.description}
                      </p>
                      {Object.keys(log.metadata || {}).length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground/70 font-mono">
                          {JSON.stringify(log.metadata).slice(0, 100)}
                          {JSON.stringify(log.metadata).length > 100 && "..."}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
