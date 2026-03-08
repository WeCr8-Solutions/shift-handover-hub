import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RefreshIndicatorProps {
  /** Whether a background refresh is in progress */
  isRefreshing: boolean;
  /** Timestamp of the last successful refresh */
  lastRefreshedAt: Date | null;
  /** Callback for manual refresh */
  onRefresh: () => void;
  /** Optional className */
  className?: string;
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/**
 * Subtle, non-intrusive refresh indicator.
 * Replaces full-screen loading spinners with a small icon button
 * that spins during background refreshes and shows last-refresh time on hover.
 */
export function RefreshIndicator({
  isRefreshing,
  lastRefreshedAt,
  onRefresh,
  className,
}: RefreshIndicatorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn("h-8 w-8 p-0 text-muted-foreground hover:text-foreground", className)}
            aria-label="Refresh data"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 transition-transform",
                isRefreshing && "animate-spin"
              )}
            />
            {/* Subtle dot indicator when refreshing */}
            {isRefreshing && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {isRefreshing
            ? "Refreshing..."
            : lastRefreshedAt
              ? `Last updated ${formatTimeSince(lastRefreshedAt)}`
              : "Click to refresh"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
