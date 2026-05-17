import { Component, useState, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssueReportDialog } from "@/components/IssueReportDialog";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  /** Short label describing where this boundary lives, e.g. "Production Analytics". */
  sectionLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ReportButton({ error, sectionLabel }: { error: Error | null; sectionLabel?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const label = sectionLabel || "dashboard section";
  const prefillTitle = `Render error in ${label}: ${error?.message?.slice(0, 80) || "unknown"}`;
  const prefillDescription = [
    `**Section:** ${label}`,
    `**Path:** ${typeof window !== "undefined" ? window.location.pathname : ""}`,
    error?.message ? `**Error:** ${error.message}` : "",
    error?.stack ? `**Stack (top):**\n${error.stack.split("\n").slice(0, 5).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Bug className="w-3 h-3" />
        Report issue
      </Button>
      <IssueReportDialog
        open={open}
        onOpenChange={setOpen}
        prefillError={error || undefined}
        prefillTitle={prefillTitle}
        prefillDescription={prefillDescription}
        prefillSeverity="high"
        contextLabel={`Render error · ${label}`}
      />
    </>
  );
}

/**
 * Error boundary for dashboard sections.
 * Catches render errors and shows a retry UI instead of crashing the whole page.
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[DashboardErrorBoundary]", error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-card border border-destructive/30 rounded-lg p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm font-medium text-foreground">
            {this.props.fallbackMessage || "Something went wrong loading this section."}
          </p>
          <p className="text-xs text-muted-foreground">
            This error has been logged. You can try reloading, or send it to the admin bug queue with a note about what you were doing.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" className="gap-2" onClick={this.handleRetry}>
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
            <ReportButton error={this.state.error} sectionLabel={this.props.sectionLabel} />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
