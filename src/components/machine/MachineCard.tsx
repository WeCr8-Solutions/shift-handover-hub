import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Cpu, Gauge, Wrench, FileCode, Hash, Wifi, WifiOff,
  AlertTriangle, Activity, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppMachineStatus } from "@/types/machine";
import { MACHINE_STATE_CONFIG } from "@/types/machine";

interface MachineCardProps {
  machine: AppMachineStatus;
  compact?: boolean;
  onClick?: () => void;
}

/**
 * MachineCard — displays a single machine's live status.
 * 
 * Phase 1: Static data from equipment table.
 * Phase 2: Live-updated from relay events (same shape, real-time upserts).
 * 
 * Based on CONTEXT.docx §8 MachineCard spec:
 *   State badge, spindle RPM, feed override, active tool, program,
 *   block number, OFFLINE badge, active alarm codes.
 */
export function MachineCard({ machine, compact = false, onClick }: MachineCardProps) {
  const stateConfig = MACHINE_STATE_CONFIG[machine.state] || MACHINE_STATE_CONFIG.unknown;
  const isOffline = !machine.connectionOk && machine.state !== "unknown";
  const hasAlarms = machine.activeAlarmCodes.length > 0;
  const isAlarming = machine.state === "alarm" || machine.state === "estop";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 group",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/30",
        isAlarming && "border-status-critical/40 shadow-status-critical/10 shadow-sm",
        isOffline && "opacity-60",
      )}
      onClick={onClick}
    >
      {/* State indicator stripe */}
      <div
        className={cn(
          "absolute top-0 left-0 w-1 h-full",
          stateConfig.dotClass,
        )}
      />

      <CardContent className={cn("pl-4", compact ? "p-3" : "p-4")}>
        {/* Header: label + state badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm truncate">{machine.label}</h4>
            {machine.manufacturer && machine.model && (
              <p className="text-xs text-muted-foreground truncate">
                {machine.manufacturer} {machine.model}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Connection indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  {machine.connectionOk ? (
                    <Wifi className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {machine.connectionOk ? "Live connection" : "No live connection — static data"}
              </TooltipContent>
            </Tooltip>
            {/* State badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 font-semibold uppercase tracking-wide",
                stateConfig.colorClass,
                isAlarming && "animate-pulse border-red-500/50",
              )}
            >
              {isOffline ? "OFFLINE" : stateConfig.label}
            </Badge>
          </div>
        </div>

        {/* Metrics grid */}
        {!compact && (
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
            <MetricCell
              icon={<Gauge className="w-3 h-3" />}
              label="Spindle"
              value={machine.spindleRpm != null ? `${machine.spindleRpm} RPM` : "—"}
              sub={machine.spindleOverride != null ? `${machine.spindleOverride}%` : undefined}
            />
            <MetricCell
              icon={<Activity className="w-3 h-3" />}
              label="Feed"
              value={machine.feedOverride != null ? `${machine.feedOverride}%` : "—"}
            />
            <MetricCell
              icon={<Wrench className="w-3 h-3" />}
              label="Tool"
              value={machine.activeTool != null ? `T${machine.activeTool}` : "—"}
            />
            <MetricCell
              icon={<FileCode className="w-3 h-3" />}
              label="Program"
              value={machine.activeProgram ?? "—"}
            />
            <MetricCell
              icon={<Hash className="w-3 h-3" />}
              label="Block"
              value={machine.blockNumber != null ? `N${machine.blockNumber}` : "—"}
            />
            <MetricCell
              icon={<Cpu className="w-3 h-3" />}
              label="Control"
              value={machine.controlType !== "unknown" ? machine.controlType : "—"}
              uppercase
            />
          </div>
        )}

        {/* Alarm codes */}
        {hasAlarms && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
            {machine.activeAlarmCodes.map((code) => (
              <Badge
                key={code}
                variant="destructive"
                className="text-[10px] px-1.5 py-0 font-mono"
              >
                {code}
              </Badge>
            ))}
          </div>
        )}

        {/* Last updated */}
        <p className="text-[10px] text-muted-foreground mt-2">
          Updated {machine.lastUpdated.toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}

/** Small metric cell used inside the card grid */
function MetricCell({
  icon,
  label,
  value,
  sub,
  uppercase,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  uppercase?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        <p
          className={cn(
            "font-medium truncate leading-tight",
            uppercase && "uppercase",
            value === "—" && "text-muted-foreground",
          )}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-muted-foreground leading-none">{sub}</p>
        )}
      </div>
    </div>
  );
}
