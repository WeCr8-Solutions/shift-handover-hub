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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIssueReporter } from "@/hooks/useIssueReporter";
import { useAuth } from "@/contexts/AuthContext";
import { Bug, AlertCircle, Terminal, Loader2, AlertTriangle, UserX } from "lucide-react";

interface IssueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillError?: Error;
}

export function IssueReportDialog({ open, onOpenChange, prefillError }: IssueReportDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const { reportIssue, isReporting, consoleLogs, runtimeErrors, productionContext } = useIssueReporter();
  
  const [title, setTitle] = useState(prefillError?.message?.slice(0, 100) || "");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">(
    prefillError || !user ? "high" : "medium"
  );
  const [includeConsoleLogs, setIncludeConsoleLogs] = useState(true);
  const [includePage, setIncludePage] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await reportIssue({
      title,
      description,
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
  const isGuestReport = !user && !authLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            {isGuestReport ? "Report Access Issue" : "Report an Issue"}
          </DialogTitle>
          <DialogDescription>
            {isGuestReport 
              ? "Having trouble logging in or accessing your data? Let us know and we'll help."
              : "Help us improve by reporting bugs or issues you encounter."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest report alert */}
          {isGuestReport && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <UserX className="h-4 w-4" />
              <AlertDescription>
                You're not currently logged in. Your report will be submitted as a guest and prioritized for review.
              </AlertDescription>
            </Alert>
          )}

          {/* Runtime context badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="font-mono">
              {productionContext.environment}
            </Badge>
            <Badge variant="outline" className="font-mono">
              v{productionContext.app_version}
            </Badge>
            {isGuestReport && (
              <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-600">
                <UserX className="w-3 h-3" />
                Guest Report
              </Badge>
            )}
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
      </DialogContent>
    </Dialog>
  );
}
