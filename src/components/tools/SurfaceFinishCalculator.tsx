import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Theoretical surface finish Ra = (f² / (32 × r)) × 1000  (in µin when f=in, r=in)
 * Rz ≈ Ra × 4  (rule of thumb)
 */

export function surfaceFinishRa(feedPerRev: number, noseRadius: number): number {
  if (noseRadius <= 0) return 0;
  return (feedPerRev * feedPerRev) / (32 * noseRadius);
}

export function SurfaceFinishCalculator() {
  const [feed, setFeed] = useState("0.006");
  const [radius, setRadius] = useState("0.031");
  const [unit, setUnit] = useState<"inch" | "metric">("inch");

  const f = parseFloat(feed) || 0;
  const r = parseFloat(radius) || 0;

  // Ra in µin (inch) or µm (metric)
  const raRaw = surfaceFinishRa(f, r);
  const ra = unit === "inch" ? raRaw * 1_000_000 : raRaw * 1_000; // convert to µin or µm
  const rz = ra * 4;

  const raLabel = unit === "inch" ? "µin" : "µm";

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Theoretical Ra from feed per revolution and tool nose radius.
      </p>

      <Select value={unit} onValueChange={(v) => setUnit(v as "inch" | "metric")}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="inch">Imperial (in)</SelectItem>
          <SelectItem value="metric">Metric (mm)</SelectItem>
        </SelectContent>
      </Select>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Feed/Rev ({unit === "inch" ? "in" : "mm"})</Label>
          <Input value={feed} onChange={(e) => setFeed(e.target.value)} type="number" step="0.001" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Nose Radius ({unit === "inch" ? "in" : "mm"})</Label>
          <Input value={radius} onChange={(e) => setRadius(e.target.value)} type="number" step="0.001" className="h-9" />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ra (theoretical)</p>
          <p className="text-xl font-bold text-primary">{ra > 0 ? ra.toFixed(1) : "—"}</p>
          <p className="text-[10px] text-muted-foreground">{raLabel}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rz (approx)</p>
          <p className="text-xl font-bold text-primary">{rz > 0 ? rz.toFixed(1) : "—"}</p>
          <p className="text-[10px] text-muted-foreground">{raLabel}</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Ra = f² / (32 × r) &nbsp;|&nbsp; Rz ≈ 4 × Ra
      </p>
    </div>
  );
}
