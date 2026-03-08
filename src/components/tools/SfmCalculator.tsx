import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const PRESETS: Record<string, { sfm: [number, number]; label: string }> = {
  aluminum: { sfm: [500, 1000], label: "Aluminum" },
  mild_steel: { sfm: [70, 120], label: "Mild Steel" },
  stainless: { sfm: [40, 80], label: "Stainless Steel" },
  titanium: { sfm: [30, 60], label: "Titanium" },
  cast_iron: { sfm: [60, 100], label: "Cast Iron" },
  brass: { sfm: [200, 400], label: "Brass" },
};

export function SfmCalculator() {
  const [sfm, setSfm] = useState<string>("300");
  const [diameter, setDiameter] = useState<string>("0.5");
  const [flutes, setFlutes] = useState<string>("4");
  const [fpt, setFpt] = useState<string>("0.003");
  const [material, setMaterial] = useState<string>("");

  const sfmVal = parseFloat(sfm) || 0;
  const diaVal = parseFloat(diameter) || 0;
  const fluteVal = parseInt(flutes) || 1;
  const fptVal = parseFloat(fpt) || 0;

  const rpm = diaVal > 0 ? (sfmVal * 12) / (Math.PI * diaVal) : 0;
  const feedRate = rpm * fptVal * fluteVal;
  const chipLoad = fluteVal > 0 && rpm > 0 ? feedRate / (rpm * fluteVal) : 0;

  const handlePreset = (key: string) => {
    setMaterial(key);
    const preset = PRESETS[key];
    if (preset) {
      const mid = Math.round((preset.sfm[0] + preset.sfm[1]) / 2);
      setSfm(mid.toString());
    }
  };

  return (
    <div className="space-y-4">
      {/* Material preset */}
      <div>
        <Label className="text-xs">Material Preset</Label>
        <Select value={material} onValueChange={handlePreset}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select material..." /></SelectTrigger>
          <SelectContent>
            {Object.entries(PRESETS).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-sm">
                {v.label} ({v.sfm[0]}–{v.sfm[1]} SFM)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">SFM (Surface Feet/Min)</Label>
          <Input value={sfm} onChange={(e) => setSfm(e.target.value)} type="number" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Cutter Diameter (in)</Label>
          <Input value={diameter} onChange={(e) => setDiameter(e.target.value)} type="number" step="0.001" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Number of Flutes</Label>
          <Input value={flutes} onChange={(e) => setFlutes(e.target.value)} type="number" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Feed per Tooth (in)</Label>
          <Input value={fpt} onChange={(e) => setFpt(e.target.value)} type="number" step="0.0001" className="h-9" />
        </div>
      </div>

      <Separator />

      {/* Results */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Spindle RPM</p>
          <p className="text-xl font-bold text-primary">{Math.round(rpm).toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Feed Rate (IPM)</p>
          <p className="text-xl font-bold text-primary">{feedRate.toFixed(1)}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Chip Load</p>
          <p className="text-xl font-bold text-primary">{chipLoad.toFixed(4)}"</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        RPM = (SFM × 12) / (π × D) &nbsp;|&nbsp; Feed = RPM × FPT × Z
      </p>
    </div>
  );
}
