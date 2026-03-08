import { Ruler, Gauge, Wrench } from "lucide-react";

export interface MachineSpecs {
  max_x_travel?: number | null;
  max_y_travel?: number | null;
  max_z_travel?: number | null;
  max_part_weight?: number | null;
  max_part_envelope_length?: number | null;
  max_part_envelope_width?: number | null;
  max_part_envelope_height?: number | null;
  typical_tolerance?: number | null;
  max_spindle_rpm?: number | null;
  spindle_taper?: string | null;
  spindle_power_hp?: number | null;
  tool_magazine_capacity?: number | null;
  max_tool_diameter?: number | null;
  max_tool_length?: number | null;
  max_turning_diameter?: number | null;
  max_turning_length?: number | null;
  bar_capacity_mm?: number | null;
}

interface MachineSpecGridProps {
  specs: MachineSpecs;
  compact?: boolean;
}

export function SpecItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string | null | undefined;
  unit?: string;
}) {
  if (value === null || value === undefined) return null;
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium">
        {value}
        {unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

export function MachineSpecGrid({ specs, compact = false }: MachineSpecGridProps) {
  const travelSpecs = [
    { label: "X Travel", value: specs.max_x_travel, unit: "mm" },
    { label: "Y Travel", value: specs.max_y_travel, unit: "mm" },
    { label: "Z Travel", value: specs.max_z_travel, unit: "mm" },
    { label: "Part Length", value: specs.max_part_envelope_length, unit: "in" },
    { label: "Part Width", value: specs.max_part_envelope_width, unit: "in" },
    { label: "Part Height", value: specs.max_part_envelope_height, unit: "in" },
    { label: "Max Weight", value: specs.max_part_weight, unit: "lbs" },
    {
      label: "Tolerance",
      value: specs.typical_tolerance ? `±${specs.typical_tolerance}"` : null,
    },
  ];

  const spindleSpecs = [
    { label: "Spindle RPM", value: specs.max_spindle_rpm, unit: "rpm" },
    { label: "Spindle Taper", value: specs.spindle_taper },
    { label: "Spindle Power", value: specs.spindle_power_hp, unit: "HP" },
    { label: "Tool Magazine", value: specs.tool_magazine_capacity, unit: "tools" },
    { label: "Max Tool Ø", value: specs.max_tool_diameter, unit: "mm" },
    { label: "Max Tool Length", value: specs.max_tool_length, unit: "mm" },
  ];

  const turningSpecs = [
    { label: "Max Turning Ø", value: specs.max_turning_diameter, unit: "mm" },
    { label: "Max Turning Length", value: specs.max_turning_length, unit: "mm" },
    { label: "Bar Capacity", value: specs.bar_capacity_mm, unit: "mm" },
  ];

  const hasTravel = travelSpecs.some((s) => s.value != null);
  const hasSpindle = spindleSpecs.some((s) => s.value != null);
  const hasTurning = turningSpecs.some((s) => s.value != null);

  if (!hasTravel && !hasSpindle && !hasTurning) return null;

  return (
    <div className="space-y-4">
      {hasTravel && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" /> Travel & Envelope
          </h4>
          <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
            {travelSpecs.map((s) => (
              <SpecItem key={s.label} {...s} />
            ))}
          </div>
        </div>
      )}

      {hasSpindle && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" /> Spindle & Tooling
          </h4>
          <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
            {spindleSpecs.map((s) => (
              <SpecItem key={s.label} {...s} />
            ))}
          </div>
        </div>
      )}

      {hasTurning && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Turning
          </h4>
          <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
            {turningSpecs.map((s) => (
              <SpecItem key={s.label} {...s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
