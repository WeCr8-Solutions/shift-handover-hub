import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
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
            This error has been logged. You can try reloading.
          </p>
          <Button variant="outline" size="sm" className="gap-2" onClick={this.handleRetry}>
            <RefreshCw className="w-3 h-3" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
