import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SystemStatusIndicatorProps {
  status: "operational" | "degraded" | "outage";
}

const statusConfig = {
  operational: { label: "Operational", dotClass: "bg-green-500", badgeClass: "border-green-500/30 text-green-600" },
  degraded: { label: "Degraded", dotClass: "bg-yellow-500 animate-pulse", badgeClass: "border-yellow-500/30 text-yellow-600" },
  outage: { label: "Outage", dotClass: "bg-red-500 animate-pulse", badgeClass: "border-red-500/30 text-red-600" },
};

export function SystemStatusIndicator({ status }: SystemStatusIndicatorProps) {
  const cfg = statusConfig[status];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`gap-1.5 text-xs cursor-default ${cfg.badgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
          {cfg.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>System Status</TooltipContent>
    </Tooltip>
  );
}
