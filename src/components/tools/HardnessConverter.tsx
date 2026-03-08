import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

/**
 * Approximate hardness conversions (ASTM E140 approximations for carbon/alloy steel).
 * Using polynomial fits – these are approximations, not exact.
 */

type Scale = "hrc" | "hrb" | "hv" | "hb";

const SCALE_LABELS: Record<Scale, string> = {
  hrc: "Rockwell C (HRC)",
  hrb: "Rockwell B (HRB)",
  hv: "Vickers (HV)",
  hb: "Brinell (HB)",
};

// Convert everything through HRC as intermediate (valid range ~20-68 HRC)
function toHrc(value: number, from: Scale): number | null {
  switch (from) {
    case "hrc": return value;
    case "hv":
      // HRC ≈ (HV / 10.9) - 3  (rough linear for mid-range)
      // Better fit: HRC ≈ -0.00023×HV² + 0.356×HV - 42.6
      if (value < 200 || value > 940) return null;
      return -0.00023 * value * value + 0.356 * value - 42.6;
    case "hb":
      // HRC ≈ (HB - 100) / 5.7  (simplified linear)
      if (value < 200 || value > 650) return null;
      return (value - 100) / 5.7;
    case "hrb":
      // Very rough: HRC ≈ (HRB - 22) / 1.2 (only valid at overlap ~20 HRC)
      if (value < 90 || value > 100) return null;
      return (value - 22) / 1.2;
    default: return null;
  }
}

export function fromHrc(hrc: number, to: Scale): number | null {
  if (hrc < 15 || hrc > 70) return null;
  switch (to) {
    case "hrc": return hrc;
    case "hv":
      // HV ≈ 15.3 × HRC + 223 (linear approximation)
      return 15.3 * hrc + 223;
    case "hb":
      // HB ≈ 5.7 × HRC + 100
      return 5.7 * hrc + 100;
    case "hrb":
      // Only valid for low HRC
      if (hrc > 25) return null;
      return 1.2 * hrc + 22;
    default: return null;
  }
}

export function convertHardness(value: number, from: Scale, to: Scale): number | null {
  if (from === to) return value;
  const hrc = toHrc(value, from);
  if (hrc === null) return null;
  return fromHrc(hrc, to);
}

export function HardnessConverter() {
  const [fromScale, setFromScale] = useState<Scale>("hrc");
  const [value, setValue] = useState("45");

  const numVal = parseFloat(value) || 0;
  const scales: Scale[] = ["hrc", "hrb", "hv", "hb"];
  const others = scales.filter((s) => s !== fromScale);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Approximate conversions per ASTM E140 for carbon/alloy steel.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">From Scale</Label>
          <Select value={fromScale} onValueChange={(v) => setFromScale(v as Scale)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {scales.map((s) => (
                <SelectItem key={s} value={s} className="text-sm">{SCALE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Value</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" className="h-9" />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-3">
        {others.map((scale) => {
          const result = convertHardness(numVal, fromScale, scale);
          return (
            <div key={scale} className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{scale.toUpperCase()}</p>
              <p className="text-xl font-bold text-primary">
                {result !== null ? Math.round(result) : "—"}
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Approximations only. Use official conversion tables for critical applications.
      </p>
    </div>
  );
}
