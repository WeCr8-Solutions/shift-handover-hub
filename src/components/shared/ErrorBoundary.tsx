import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center text-muted-foreground">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-sm">Something went wrong loading this section.</p>
            <Button variant="outline" size="sm" onClick={() => this.setState({ error: null })}>
              Retry
            </Button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
