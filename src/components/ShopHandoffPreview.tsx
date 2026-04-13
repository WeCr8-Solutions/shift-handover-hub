import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type ShopType, SHOP_TYPE_CONTENT } from "@/lib/shopTypes";

interface ShopHandoffPreviewProps {
  /** The currently selected shop type */
  shopType: ShopType;
  /**
   * "board" — shows only the live job board (used on /start)
   * "handoffs" — shows only the recent handoffs panel (replaces the Landing hardcoded block)
   * "both" — shows job board + handoffs side by side (wide layouts)
   */
  variant?: "board" | "handoffs" | "both";
  className?: string;
  /** Called when the user clicks the handoffs panel (e.g. navigate to feature page) */
  onHandoffsClick?: () => void;
}

export function ShopHandoffPreview({
  shopType,
  variant = "board",
  className,
  onHandoffsClick,
}: ShopHandoffPreviewProps) {
  const content = SHOP_TYPE_CONTENT[shopType];

  const JobBoard = (
    <div className="rounded-xl border border-primary/20 bg-muted/30 p-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
          Live Job Board
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Live</span>
        </span>
      </div>
      {content.jobs.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/70 border border-border/40"
        >
          <span className="text-xs font-medium text-foreground">{item.label}</span>
          <span className={cn("text-[11px] font-bold", item.color)}>{item.status}</span>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
        Your board looks like this — updates in real time
      </p>
    </div>
  );

  const HandoffsPanel = (
    <div
      className={cn(
        "bg-card border border-border rounded-xl overflow-hidden",
        onHandoffsClick && "cursor-pointer hover:border-primary/50 transition-all group"
      )}
      onClick={onHandoffsClick}
    >
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Recent Handoffs</span>
          <span className="ml-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-muted-foreground">Live</span>
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {content.handoffs.map((h, i) => (
          <div key={i} className="p-3 rounded-lg bg-secondary/20 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-medium">{h.station}</span>
              <span className="text-[10px] text-muted-foreground">{h.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="text-muted-foreground">{h.from}</span>
              <ArrowRight className="w-3 h-3 text-primary shrink-0" />
              <span className="font-medium">{h.to}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <Badge
                variant="outline"
                className={cn(
                  "px-1.5 py-0",
                  h.state === "Running" || h.state === "In Progress" || h.state === "In Paint"
                    ? "border-green-500/50 text-green-400"
                    : h.state === "Complete"
                    ? "border-primary/50 text-primary"
                    : "border-amber-500/50 text-amber-400"
                )}
              >
                {h.state}
              </Badge>
              <span className="text-muted-foreground truncate ml-2">{h.meta}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (variant === "board") return <div className={className}>{JobBoard}</div>;
  if (variant === "handoffs") return <div className={className}>{HandoffsPanel}</div>;

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {JobBoard}
      {HandoffsPanel}
    </div>
  );
}
