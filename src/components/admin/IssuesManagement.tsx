import React, { useState, useEffect } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { 
  Bug, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Clock, 
  Terminal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCcw,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Issue {
  id: string;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "in_progress" | "resolved" | "closed" | "wont_fix";
  error_message: string | null;
  error_stack: string | null;
  console_logs: Record<string, unknown>[] | null;
  page_url: string | null;
  environment: string;
  app_version: string | null;
  build_id: string | null;
  commit_hash: string | null;
  user_agent: string | null;
  reporter_id: string | null;
  reporter_email: string | null;
  reporter_display_name: string | null;
  assigned_to: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

const severityColors: Record<string, string> = {
  low: "bg-status-ok/10 text-status-ok border-status-ok/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20",
  critical: "bg-status-critical/10 text-status-critical border-status-critical/20",
};

const statusColors: Record<string, string> = {
  open: "bg-status-waiting/10 text-status-waiting border-status-waiting/20",
  investigating: "bg-role-org-owner/10 text-role-org-owner border-role-org-owner/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-status-ok/10 text-status-ok border-status-ok/20",
  closed: "bg-muted text-muted-foreground border-border",
  wont_fix: "bg-muted text-muted-foreground border-border",
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertCircle className="w-3 h-3" />,
  investigating: <Search className="w-3 h-3" />,
  in_progress: <Loader2 className="w-3 h-3" />,
  resolved: <CheckCircle className="w-3 h-3" />,
  closed: <XCircle className="w-3 h-3" />,
  wont_fix: <XCircle className="w-3 h-3" />,
};

export function IssuesManagement() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");  const [statusFilter, setStatusFilter] = useUrlState<string>("s", "all");  const [severityFilter, setSeverityFilter] = useUrlState<string>("sev", "all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);

  // Fetch issues
  const fetchIssues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIssues((data as Issue[]) || []);
    } catch (error) {
      console.error("Error fetching issues:", error);
      toast({
        title: "Failed to load issues",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.reporter_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.error_message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Update issue
  const updateIssue = async (issueId: string, updates: Partial<Pick<Issue, "status" | "severity" | "resolution_notes" | "assigned_to">>) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("issues")
        .update(updates)
        .eq("id", issueId);

      if (error) throw error;

      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, ...updates } : i));
      toast({ title: "Issue updated" });
    } catch (error) {
      console.error("Error updating issue:", error);
      toast({ title: "Failed to update issue", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === "open").length,
    critical: issues.filter(i => i.severity === "critical" && i.status !== "resolved" && i.status !== "closed").length,
    resolved: issues.filter(i => i.status === "resolved" || i.status === "closed").length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Issues</CardTitle>
              <CardDescription>Manage reported bugs and issues</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchIssues} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10">
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            <div className="text-sm text-muted-foreground">Open</div>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="wont_fix">Won't Fix</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[150px]">
              <AlertCircle className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Issues Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No issues found
                  </TableCell>
                </TableRow>
              ) : (
                filteredIssues.map((issue) => (
                  <React.Fragment key={issue.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={() => toggleRow(issue.id)}>
                        {expandedRows.has(issue.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </TableCell>
                      <TableCell onClick={() => toggleRow(issue.id)}>
                        <div className="font-medium truncate max-w-[300px]">{issue.title}</div>
                        {issue.error_message && (
                          <div className="text-xs text-muted-foreground truncate max-w-[300px] font-mono">
                            {issue.error_message}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={severityColors[issue.severity]}>
                          {issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${statusColors[issue.status]}`}>
                          {statusIcons[issue.status]}
                          {issue.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{issue.reporter_display_name || issue.reporter_email || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedIssue(issue)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(issue.id) && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="p-4 space-y-3">
                            {issue.description && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                <p className="text-sm">{issue.description}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-muted-foreground">Environment</Label>
                                <p>{issue.environment}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Version</Label>
                                <p>{issue.app_version || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Build</Label>
                                <p className="font-mono text-xs">{issue.build_id || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Page</Label>
                                <p className="truncate">{issue.page_url || "N/A"}</p>
                              </div>
                            </div>
                            {issue.error_stack && (
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Terminal className="w-3 h-3" />
                                  Stack Trace
                                </Label>
                                <pre className="text-xs font-mono bg-background p-2 rounded overflow-auto max-h-32 mt-1">
                                  {issue.error_stack}
                                </pre>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <Select
                                value={issue.status}
                                onValueChange={(v) => updateIssue(issue.id, { status: v as Issue["status"] })}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="investigating">Investigating</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                  <SelectItem value="wont_fix">Won't Fix</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={issue.severity}
                                onValueChange={(v) => updateIssue(issue.id, { severity: v as Issue["severity"] })}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Issue Detail Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Issue Details
            </DialogTitle>
            <DialogDescription>
              {selectedIssue?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedIssue && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedIssue.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={severityColors[selectedIssue.severity]}>
                      {selectedIssue.severity}
                    </Badge>
                    <Badge variant="outline" className={statusColors[selectedIssue.status]}>
                      {selectedIssue.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {selectedIssue.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedIssue.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reporter</Label>
                    <p className="text-sm">{selectedIssue.reporter_display_name || selectedIssue.reporter_email}</p>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm">{new Date(selectedIssue.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Environment</Label>
                    <p className="text-sm">{selectedIssue.environment}</p>
                  </div>
                  <div>
                    <Label>Version / Build</Label>
                    <p className="text-sm font-mono">{selectedIssue.app_version} / {selectedIssue.build_id}</p>
                  </div>
                </div>

                {selectedIssue.page_url && (
                  <div>
                    <Label>Page URL</Label>
                    <a 
                      href={selectedIssue.page_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      {selectedIssue.page_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {selectedIssue.error_message && (
                  <div>
                    <Label className="text-red-600">Error Message</Label>
                    <pre className="text-sm font-mono bg-red-500/10 p-3 rounded mt-1 overflow-auto">
                      {selectedIssue.error_message}
                    </pre>
                  </div>
                )}

                {selectedIssue.error_stack && (
                  <div>
                    <Label>Stack Trace</Label>
                    <pre className="text-xs font-mono bg-muted p-3 rounded mt-1 overflow-auto max-h-40">
                      {selectedIssue.error_stack}
                    </pre>
                  </div>
                )}

                {selectedIssue.console_logs && selectedIssue.console_logs.length > 0 && (
                  <div>
                    <Label className="flex items-center gap-1">
                      <Terminal className="w-4 h-4" />
                      Console Logs ({selectedIssue.console_logs.length})
                    </Label>
                    <div className="bg-muted p-3 rounded mt-1 max-h-48 overflow-auto">
                      {(selectedIssue.console_logs as Array<{level: string; message: string; timestamp: string}>).map((log, i) => (
                        <div key={i} className={`text-xs font-mono ${
                          log.level === "error" ? "text-red-500" : 
                          log.level === "warn" ? "text-yellow-500" : ""
                        }`}>
                          [{log.level}] {log.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Resolution Notes</Label>
                  <Textarea
                    value={selectedIssue.resolution_notes || ""}
                    onChange={(e) => setSelectedIssue({ ...selectedIssue, resolution_notes: e.target.value })}
                    placeholder="Add notes about how this was resolved..."
                    rows={3}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIssue(null)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                if (selectedIssue) {
                  updateIssue(selectedIssue.id, { resolution_notes: selectedIssue.resolution_notes });
                  setSelectedIssue(null);
                }
              }}
              disabled={updating}
            >
              {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
