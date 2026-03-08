/**
 * src/components/machine/MachineStatusGrid.tsx
 *
 * Based on CONTEXT.docx §8 MachineStatusGrid spec.
 * Per PRD 11 §1: Uses useMachineMonitoring as the primary data hook.
 */

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi, WifiOff, Radio, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { MachineCard } from "./MachineCard";
import { useMachineMonitoring } from "@/hooks/useMachineMonitoring";
import type { RelayConnectionState } from "@/types/machine";

interface MachineStatusGridProps {
  organizationId: string | null;
  stationId?: string | null;
  compact?: boolean;
  onMachineClick?: (machineId: string) => void;
}

const RELAY_CONFIG: Record<
  RelayConnectionState,
  { label: string; icon: typeof Wifi; dotClass: string }
> = {
  connected:    { label: "Live",          icon: Wifi,    dotClass: "bg-green-500" },
  connecting:   { label: "Connecting…",   icon: Radio,   dotClass: "bg-amber-500" },
  disconnected: { label: "Static Data",   icon: WifiOff, dotClass: "bg-muted-foreground" },
};

export function MachineStatusGrid({
  organizationId,
  stationId,
  compact = false,
  onMachineClick,
}: MachineStatusGridProps) {
  const { machines, loading, relayState } = useMachineMonitoring({
    organizationId,
    stationId,
  });

  const relayConfig = RELAY_CONFIG[relayState];
  const RelayIcon = relayConfig.icon;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Relay status banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Equipment{stationId ? " at Station" : ""} ({machines.length})
          </span>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs">
          <span className={cn("w-1.5 h-1.5 rounded-full", relayConfig.dotClass)} />
          <RelayIcon className="w-3 h-3" />
          {relayConfig.label}
        </Badge>
      </div>

      {/* Grid */}
      {machines.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>No equipment registered{stationId ? " at this station" : ""}.</p>
          <p className="text-xs mt-1">
            Add equipment in Settings → Equipment to see machine cards here.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-3",
            compact
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          )}
        >
          {machines.map((machine) => (
            <MachineCard
              key={machine.machineId}
              machine={machine}
              compact={compact}
              onClick={onMachineClick ? () => onMachineClick(machine.machineId) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
