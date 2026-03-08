import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleDot } from "lucide-react";

export interface MachineCapabilities {
  five_axis_simultaneous?: boolean;
  fourth_axis?: boolean;
  live_tooling?: boolean;
  y_axis_turn?: boolean;
  sub_spindle?: boolean;
  probing?: boolean;
  through_spindle_coolant?: boolean;
  pallet_pool?: boolean;
  bar_feeder?: boolean;
}

interface MachineCapabilityBadgesProps {
  capabilities: MachineCapabilities;
  materials?: string[];
}

const CAPABILITY_LABELS: Record<keyof MachineCapabilities, string> = {
  five_axis_simultaneous: "5-Axis Simultaneous",
  fourth_axis: "4th Axis",
  live_tooling: "Live Tooling",
  y_axis_turn: "Y-Axis Turn",
  sub_spindle: "Sub Spindle",
  probing: "Probing",
  through_spindle_coolant: "Through Spindle Coolant",
  pallet_pool: "Pallet Pool",
  bar_feeder: "Bar Feeder",
};

export function MachineCapabilityBadges({ capabilities, materials }: MachineCapabilityBadgesProps) {
  const activeCapabilities = (Object.keys(CAPABILITY_LABELS) as Array<keyof MachineCapabilities>)
    .filter((key) => capabilities[key])
    .map((key) => CAPABILITY_LABELS[key]);

  const hasCapabilities = activeCapabilities.length > 0;
  const hasMaterials = materials && materials.length > 0;

  if (!hasCapabilities && !hasMaterials) return null;

  return (
    <div className="space-y-4">
      {hasCapabilities && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            Capabilities
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {activeCapabilities.map((cap) => (
              <Badge key={cap} variant="secondary" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                {cap}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasMaterials && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CircleDot className="w-3.5 h-3.5" /> Material Capability
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {materials!.map((m) => (
              <Badge key={m} variant="outline" className="text-xs">
                {m}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
