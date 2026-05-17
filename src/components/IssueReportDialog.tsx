import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIssueReporter } from "@/hooks/useIssueReporter";
import { useAuth } from "@/contexts/AuthContext";
import { Bug, AlertCircle, Terminal, Loader2, LogIn, Mail, Layers, Footprints } from "lucide-react";
import { Link } from "react-router-dom";
import { issueReporterRegistry, breadcrumbs } from "@/lib/issueReporter";

interface IssueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillError?: Error;
  /** Optional pre-filled title (e.g. "Dead end at /missing-route"). */
  prefillTitle?: string;
  /** Optional pre-filled description (e.g. attempted path, referrer). */
  prefillDescription?: string;
  /** Optional default severity. */
  prefillSeverity?: "low" | "medium" | "high" | "critical";
  /** Short label shown above the workflow prompt, e.g. "Dead end". */
  contextLabel?: string;
}

export function IssueReportDialog({
  open,
  onOpenChange,
  prefillError,
  prefillTitle,
  prefillDescription,
  prefillSeverity,
  contextLabel,
}: IssueReportDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const { reportIssue, isReporting, consoleLogs, runtimeErrors, productionContext } = useIssueReporter();

  const [title, setTitle] = useState(prefillTitle || prefillError?.message?.slice(0, 100) || "");
  const [description, setDescription] = useState(prefillDescription || "");
  const [workflow, setWorkflow] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">(
    prefillSeverity || (prefillError ? "high" : "medium")
  );
  const [includeConsoleLogs, setIncludeConsoleLogs] = useState(true);
  const [includePage, setIncludePage] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Compose a workflow-aware description so admins see intent + context.
    const composed = [
      workflow.trim() && `**What I was trying to do:**\n${workflow.trim()}`,
      description.trim() && `**Additional details:**\n${description.trim()}`,
      contextLabel && `**Context:** ${contextLabel}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const result = await reportIssue({
      title,
      description: composed || description,
      severity,
      includeConsoleLogs,
      includePage,
    });

    if (result.success) {
      setTitle("");
      setDescription("");
      setSeverity("medium");
      onOpenChange(false);
    }
  };

  const errorCount = runtimeErrors.length;
  const warningCount = consoleLogs.filter(l => l.level === "warn").length;
  const isNotAuthenticated = !user && !authLoading;
  // Snapshot once when the dialog opens so the list is stable while editing.
  const activeModules = open ? issueReporterRegistry.snapshot() : [];
  const breadcrumbCount = open ? breadcrumbs.snapshot().length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs or issues you encounter.
          </DialogDescription>
        </DialogHeader>

        {/* Show login prompt for unauthenticated users */}
        {isNotAuthenticated ? (
          <div className="space-y-4 py-4">
            <Alert>
              <LogIn className="h-4 w-4" />
              <AlertTitle>Sign in required</AlertTitle>
              <AlertDescription>
                Please sign in to report an issue. This helps us track and respond to your feedback.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-3">
              <Button asChild>
                <Link to="/auth" onClick={() => onOpenChange(false)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Having trouble signing in?</p>
                <a 
                  href="mailto:support@joblineai.com?subject=Access Issue - Cannot Sign In" 
                  className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <Mail className="w-3 h-3" />
                  Contact support@joblineai.com
                </a>
              </div>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Runtime context badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="font-mono">
              {productionContext.environment}
            </Badge>
            <Badge variant="outline" className="font-mono">
              v{productionContext.app_version}
            </Badge>
            {errorCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                {errorCount} error{errorCount > 1 ? "s" : ""}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600">
                {warningCount} warning{warningCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, expected behavior, etc."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Low - Minor inconvenience
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Medium - Affects workflow
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    High - Major functionality broken
                  </span>
                </SelectItem>
                <SelectItem value="critical">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Critical - App unusable
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 p-3 rounded-lg bg-muted/50">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Diagnostic Data
            </Label>

            {/* Registry-driven page context */}
            {activeModules.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Layers className="w-3 h-3" />
                  Active modules ({activeModules.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeModules.slice(-4).map((m) => (
                    <Badge key={m.id} variant="secondary" className="text-[10px] font-normal">
                      {m.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {breadcrumbCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Footprints className="w-3 h-3" />
                {breadcrumbCount} recent action{breadcrumbCount === 1 ? "" : "s"} captured
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeConsoleLogs"
                checked={includeConsoleLogs}
                onCheckedChange={(checked) => setIncludeConsoleLogs(checked === true)}
              />
              <label htmlFor="includeConsoleLogs" className="text-sm text-muted-foreground cursor-pointer">
                Include console logs ({consoleLogs.length} captured)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePage"
                checked={includePage}
                onCheckedChange={(checked) => setIncludePage(checked === true)}
              />
              <label htmlFor="includePage" className="text-sm text-muted-foreground cursor-pointer">
                Include current page URL
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isReporting || !title.trim()}>
              {isReporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Issue"
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
