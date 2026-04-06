import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type OpMode = "milling" | "turning";

const MILLING_PRESETS: Record<string, { sfm: [number, number]; fpt: [number, number]; label: string }> = {
  aluminum: { sfm: [500, 1000], fpt: [0.003, 0.008], label: "Aluminum" },
  mild_steel: { sfm: [70, 120], fpt: [0.002, 0.005], label: "Mild Steel" },
  stainless: { sfm: [40, 80], fpt: [0.001, 0.004], label: "Stainless Steel" },
  titanium: { sfm: [30, 60], fpt: [0.001, 0.003], label: "Titanium" },
  cast_iron: { sfm: [60, 100], fpt: [0.002, 0.005], label: "Cast Iron" },
  brass: { sfm: [200, 400], fpt: [0.003, 0.007], label: "Brass" },
};

const TURNING_PRESETS: Record<string, { sfm: [number, number]; fpr: [number, number]; label: string }> = {
  aluminum: { sfm: [600, 1200], fpr: [0.005, 0.015], label: "Aluminum" },
  mild_steel: { sfm: [200, 400], fpr: [0.004, 0.012], label: "Mild Steel" },
  stainless: { sfm: [100, 250], fpr: [0.003, 0.010], label: "Stainless Steel" },
  titanium: { sfm: [50, 120], fpr: [0.003, 0.008], label: "Titanium" },
  cast_iron: { sfm: [150, 300], fpr: [0.004, 0.012], label: "Cast Iron" },
  brass: { sfm: [400, 600], fpr: [0.005, 0.015], label: "Brass" },
};

const INSERT_STYLES_MILLING = [
  { id: "square", label: "Square (SEMT/SNMG)", desc: "General purpose, 90° lead angle" },
  { id: "round", label: "Round (RPMW/RCKT)", desc: "Ramping, 3D contouring, high feed" },
  { id: "triangle", label: "Triangular (TPMX)", desc: "Light cuts, finishing" },
  { id: "octagon", label: "Octagonal (ONMU)", desc: "High-feed face milling" },
];

const INSERT_STYLES_TURNING = [
  { id: "cnmg", label: "CNMG (80° Diamond)", desc: "General turning, good versatility" },
  { id: "dnmg", label: "DNMG (55° Diamond)", desc: "Profiling, copy turning" },
  { id: "vnmg", label: "VNMG (35° Diamond)", desc: "Finishing, tight profiling" },
  { id: "wnmg", label: "WNMG (80° Trigon)", desc: "Heavy roughing, interrupted cuts" },
  { id: "tnmg", label: "TNMG (Triangle)", desc: "General purpose, 3 edges" },
  { id: "snmg", label: "SNMG (Square)", desc: "Heavy cuts, 4 edges, max economy" },
];

export function SfmCalculator() {
  const [mode, setMode] = useState<OpMode>("milling");
  const [sfm, setSfm] = useState<string>("300");
  const [diameter, setDiameter] = useState<string>("0.5");
  const [flutes, setFlutes] = useState<string>("4");
  const [fpt, setFpt] = useState<string>("0.003");
  const [fpr, setFpr] = useState<string>("0.008");
  const [doc, setDoc] = useState<string>("0.050");
  const [material, setMaterial] = useState<string>("");

  const sfmVal = parseFloat(sfm) || 0;
  const diaVal = parseFloat(diameter) || 0;
  const fluteVal = parseInt(flutes) || 1;
  const fptVal = parseFloat(fpt) || 0;
  const fprVal = parseFloat(fpr) || 0;
  const docVal = parseFloat(doc) || 0;

  const rpm = diaVal > 0 ? (sfmVal * 12) / (Math.PI * diaVal) : 0;

  // Milling calcs
  const feedRateMilling = rpm * fptVal * fluteVal;
  const chipLoadMilling = fluteVal > 0 && rpm > 0 ? feedRateMilling / (rpm * fluteVal) : 0;

  // Turning calcs
  const feedRateTurning = rpm * fprVal; // IPR to IPM
  const mrr = Math.PI * diaVal * sfmVal * fprVal * docVal; // rough MRR in³/min

  const handlePreset = (key: string) => {
    setMaterial(key);
    if (mode === "milling") {
      const preset = MILLING_PRESETS[key];
      if (preset) {
        setSfm(Math.round((preset.sfm[0] + preset.sfm[1]) / 2).toString());
        setFpt(((preset.fpt[0] + preset.fpt[1]) / 2).toFixed(4));
      }
    } else {
      const preset = TURNING_PRESETS[key];
      if (preset) {
        setSfm(Math.round((preset.sfm[0] + preset.sfm[1]) / 2).toString());
        setFpr(((preset.fpr[0] + preset.fpr[1]) / 2).toFixed(4));
      }
    }
  };

  const handleModeChange = (newMode: OpMode) => {
    setMode(newMode);
    setMaterial("");
    if (newMode === "turning") {
      setDiameter("2.0");
      setSfm("300");
      setFpr("0.008");
      setDoc("0.050");
    } else {
      setDiameter("0.5");
      setSfm("300");
      setFlutes("4");
      setFpt("0.003");
    }
  };

  const presets = mode === "milling" ? MILLING_PRESETS : TURNING_PRESETS;
  const insertStyles = mode === "milling" ? INSERT_STYLES_MILLING : INSERT_STYLES_TURNING;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div>
        <Label className="text-xs font-semibold mb-1.5 block">Operation Type</Label>
        <RadioGroup
          value={mode}
          onValueChange={(v) => handleModeChange(v as OpMode)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="milling" id="mode-mill" />
            <Label htmlFor="mode-mill" className="text-sm cursor-pointer">Milling</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="turning" id="mode-turn" />
            <Label htmlFor="mode-turn" className="text-sm cursor-pointer">Turning</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Material preset */}
      <div>
        <Label className="text-xs">Material Preset</Label>
        <Select value={material} onValueChange={handlePreset}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select material..." /></SelectTrigger>
          <SelectContent>
            {Object.entries(presets).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-sm">
                {v.label} ({v.sfm[0]}–{v.sfm[1]} SFM)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inputs — differ by mode */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">SFM (Surface Feet/Min)</Label>
          <Input value={sfm} onChange={(e) => setSfm(e.target.value)} type="number" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">
            {mode === "milling" ? "Cutter Diameter (in)" : "Workpiece Diameter (in)"}
          </Label>
          <Input value={diameter} onChange={(e) => setDiameter(e.target.value)} type="number" step="0.001" className="h-9" />
        </div>
        {mode === "milling" ? (
          <>
            <div>
              <Label className="text-xs">Number of Flutes</Label>
              <Input value={flutes} onChange={(e) => setFlutes(e.target.value)} type="number" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Feed per Tooth (in)</Label>
              <Input value={fpt} onChange={(e) => setFpt(e.target.value)} type="number" step="0.0001" className="h-9" />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label className="text-xs">Feed per Rev (IPR)</Label>
              <Input value={fpr} onChange={(e) => setFpr(e.target.value)} type="number" step="0.0001" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Depth of Cut (in)</Label>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} type="number" step="0.001" className="h-9" />
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Results */}
      {mode === "milling" ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Spindle RPM</p>
            <p className="text-xl font-bold text-primary">{Math.round(rpm).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Feed Rate (IPM)</p>
            <p className="text-xl font-bold text-primary">{feedRateMilling.toFixed(1)}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Chip Load</p>
            <p className="text-xl font-bold text-primary">{chipLoadMilling.toFixed(4)}"</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Spindle RPM</p>
            <p className="text-xl font-bold text-primary">{Math.round(rpm).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Feed (IPM)</p>
            <p className="text-xl font-bold text-primary">{feedRateTurning.toFixed(1)}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">MRR (in³/min)</p>
            <p className="text-xl font-bold text-primary">{mrr.toFixed(2)}</p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        {mode === "milling"
          ? "RPM = (SFM × 12) / (π × D)  |  Feed = RPM × FPT × Z"
          : "RPM = (SFM × 12) / (π × D)  |  Feed = RPM × IPR  |  MRR ≈ π × D × SFM × IPR × DOC"}
      </p>

      <Separator />

      {/* Insert style guide */}
      <div>
        <Label className="text-xs font-semibold mb-2 block">
          {mode === "milling" ? "Milling Insert Styles" : "Turning Insert Styles"}
        </Label>
        <div className="space-y-1.5">
          {insertStyles.map((s) => (
            <div key={s.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50 border border-border">
              <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{s.label}</Badge>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick guidelines */}
      <div className="p-3 rounded-lg bg-accent/30 border border-accent/50">
        <p className="text-xs font-semibold mb-1">
          {mode === "milling" ? "Milling Guidelines" : "Turning Guidelines"}
        </p>
        {mode === "milling" ? (
          <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
            <li>Start at 70% of max SFM, increase gradually</li>
            <li>Chip load too low → rubbing & heat buildup</li>
            <li>Use climb milling when machine rigidity allows</li>
            <li>Radial engagement &gt;50% → reduce feed per tooth</li>
            <li>Round inserts: best for ramp-in and 3D surfaces</li>
          </ul>
        ) : (
          <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
            <li>Larger nose radius = better finish, more cutting force</li>
            <li>Feed should be ≤ ½ the nose radius for good finish</li>
            <li>DOC below insert nose radius = poor chip control</li>
            <li>CNMG is the most versatile; DNMG/VNMG for profiling</li>
            <li>Use negative-rake inserts for roughing interrupted cuts</li>
          </ul>
        )}
      </div>
    </div>
  );
}
