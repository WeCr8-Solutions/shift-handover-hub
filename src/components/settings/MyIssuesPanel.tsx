import { useMyIssues } from "@/hooks/useMyIssues";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Bug,
  RefreshCw,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

const severityColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-priority-urgent text-primary-foreground",
  medium: "bg-warning text-primary-foreground",
  low: "bg-status-ok text-primary-foreground",
};

const statusIcons: Record<string, typeof Clock> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
  closed: CheckCircle2,
};

const devStatusLabels: Record<string, string> = {
  queued: "Queued for review",
  in_progress: "Developer working on it",
  blocked: "Blocked — waiting for info",
  completed: "Fix completed",
  deferred: "Deferred to future release",
};

export function MyIssuesPanel() {
  const { issues, loading, refetch } = useMyIssues();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
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
              My Reported Issues
            </CardTitle>
            <CardDescription>
              Track the status of bugs and issues you've submitted
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {issues.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bug className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No issues reported yet</p>
            <p className="text-xs mt-1">
              Use the bug icon in the header to report issues
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function IssueCard({ issue }: { issue: ReturnType<typeof useMyIssues>["issues"][0] }) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = statusIcons[issue.status] || AlertCircle;
  const isResolved = issue.status === "resolved" || issue.status === "closed";

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className={`border rounded-lg transition-colors ${isResolved ? "border-green-500/20 bg-green-500/5" : "border-border"}`}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 text-left hover:bg-muted/50 rounded-lg transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className={`w-4 h-4 shrink-0 ${isResolved ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className="font-medium text-sm truncate">{issue.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge className={`text-[10px] px-1.5 py-0 ${severityColors[issue.severity] || "bg-muted"}`}>
                    {issue.severity}
                  </Badge>
                  <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                  {issue.dev_queue && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{issue.dev_queue.status.replace("_", " ")}</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t pt-3">
            {/* Description */}
            {issue.description && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</h5>
                <p className="text-sm text-foreground">{issue.description}</p>
              </div>
            )}

            {/* Page URL */}
            {issue.page_url && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Page</h5>
                <a
                  href={issue.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {issue.page_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Dev Queue Status */}
            {issue.dev_queue && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase">Developer Status</h5>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs capitalize">
                    {issue.dev_queue.status.replace("_", " ")}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {devStatusLabels[issue.dev_queue.status] || issue.dev_queue.status}
                  </span>
                </div>
                {issue.dev_queue.assigned_developer_name && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    Assigned to: {issue.dev_queue.assigned_developer_name}
                  </div>
                )}
                {issue.dev_queue.notes && (
                  <div>
                    <h6 className="text-xs font-medium text-muted-foreground mb-1">Developer Notes</h6>
                    <p className="text-xs text-foreground bg-background/50 rounded p-2">{issue.dev_queue.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Resolution */}
            {isResolved && issue.resolved_at && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolved {formatDistanceToNow(new Date(issue.resolved_at), { addSuffix: true })}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
