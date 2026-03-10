import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSystemStatusColor } from "@/lib/status-colors";

interface SystemStatusIndicatorProps {
  status: "operational" | "degraded" | "outage";
}

const statusConfig = {
  operational: { label: "Operational", ...getSystemStatusColor("operational") },
  degraded: { label: "Degraded", ...getSystemStatusColor("degraded") },
  outage: { label: "Outage", ...getSystemStatusColor("outage") },
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
