import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import { MANUFACTURERS, MACHINE_TYPES } from "@/hooks/useStationMachineProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Wrench, Save } from "lucide-react";

const PLATFORM_CATEGORIES = [
  "HAAS Platform",
  "FANUC Platform",
  "Siemens Platform",
  "Heidenhain Platform",
  "Mazatrol Platform",
  "Okuma OSP Platform",
  "Mitsubishi Platform",
  "Fagor Platform",
  "Other",
] as const;

const MATERIALS = [
  "Aluminum",
  "Steel",
  "Stainless Steel",
  "Titanium",
  "Inconel",
  "Copper",
  "Brass",
  "Plastics",
  "Composites",
  "Cast Iron",
  "Tool Steel",
  "Other",
] as const;

interface Props {
  stationId: string;
  stationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProfile?: any;
  onSaved?: () => void;
}

export function StationManualMachineEntry({
  stationId,
  stationName,
  open,
  onOpenChange,
  existingProfile,
  onSaved,
}: Props) {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Form state
  const [manufacturer, setManufacturer] = useState(existingProfile?.manufacturer || "");
  const [customManufacturer, setCustomManufacturer] = useState("");
  const [model, setModel] = useState(existingProfile?.model || "");
  const [machineType, setMachineType] = useState(existingProfile?.machine_type || "");
  const [platformCategory, setPlatformCategory] = useState(existingProfile?.platform_category || "");

  // Envelope
  const [maxX, setMaxX] = useState(existingProfile?.max_x_travel?.toString() || "");
  const [maxY, setMaxY] = useState(existingProfile?.max_y_travel?.toString() || "");
  const [maxZ, setMaxZ] = useState(existingProfile?.max_z_travel?.toString() || "");
  const [maxWeight, setMaxWeight] = useState(existingProfile?.max_part_weight?.toString() || "");
  const [maxLength, setMaxLength] = useState(existingProfile?.max_part_envelope_length?.toString() || "");
  const [maxWidth, setMaxWidth] = useState(existingProfile?.max_part_envelope_width?.toString() || "");
  const [maxHeight, setMaxHeight] = useState(existingProfile?.max_part_envelope_height?.toString() || "");

  // Capability flags
  const [fiveAxis, setFiveAxis] = useState(existingProfile?.five_axis_simultaneous || false);
  const [fourthAxis, setFourthAxis] = useState(existingProfile?.fourth_axis || false);
  const [liveTooling, setLiveTooling] = useState(existingProfile?.live_tooling || false);
  const [yAxisTurn, setYAxisTurn] = useState(existingProfile?.y_axis_turn || false);
  const [subSpindle, setSubSpindle] = useState(existingProfile?.sub_spindle || false);
  const [probingFlag, setProbingFlag] = useState(existingProfile?.probing || false);
  const [tsc, setTsc] = useState(existingProfile?.through_spindle_coolant || false);
  const [palletPool, setPalletPool] = useState(existingProfile?.pallet_pool || false);
  const [barFeeder, setBarFeeder] = useState(existingProfile?.bar_feeder || false);

  // Materials & tolerance
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(existingProfile?.material_capability || []);
  const [tolerance, setTolerance] = useState(existingProfile?.typical_tolerance?.toString() || "");

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const handleSave = async () => {
    if (!user || !organization) return;
    const mfg = manufacturer === "Other" ? customManufacturer : manufacturer;
    if (!mfg || !model || !machineType || !platformCategory) {
      toast({ title: "Missing fields", description: "Manufacturer, Model, Machine Type, and Platform are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      station_id: stationId,
      organization_id: organization.id,
      created_by: user.id,
      manufacturer: mfg,
      model,
      machine_type: machineType,
      platform_category: platformCategory,
      max_x_travel: maxX ? parseFloat(maxX) : null,
      max_y_travel: maxY ? parseFloat(maxY) : null,
      max_z_travel: maxZ ? parseFloat(maxZ) : null,
      max_part_weight: maxWeight ? parseFloat(maxWeight) : null,
      max_part_envelope_length: maxLength ? parseFloat(maxLength) : null,
      max_part_envelope_width: maxWidth ? parseFloat(maxWidth) : null,
      max_part_envelope_height: maxHeight ? parseFloat(maxHeight) : null,
      five_axis_simultaneous: fiveAxis,
      fourth_axis: fourthAxis,
      live_tooling: liveTooling,
      y_axis_turn: yAxisTurn,
      sub_spindle: subSpindle,
      probing: probingFlag,
      through_spindle_coolant: tsc,
      pallet_pool: palletPool,
      bar_feeder: barFeeder,
      material_capability: selectedMaterials,
      typical_tolerance: tolerance ? parseFloat(tolerance) : null,
      hard_constraints: [],
    };

    let error;
    if (existingProfile) {
      ({ error } = await supabase
        .from("station_manual_machine_profiles" as any)
        .update(payload as any)
        .eq("id", existingProfile.id));
    } else {
      ({ error } = await supabase
        .from("station_manual_machine_profiles" as any)
        .insert(payload as any));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: getSafeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: existingProfile ? "Profile updated" : "Profile saved", description: `Machine context for "${stationName}" is now active.` });
      onSaved?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Manual Machine Entry — {stationName}
          </DialogTitle>
          <DialogDescription>
            Enter your machine's specs manually. This data enables AI routing validation for this station.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
          <div className="space-y-6 pb-4">
            {/* Machine Identity */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Machine Identity</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Manufacturer *</Label>
                  <Select value={manufacturer} onValueChange={setManufacturer}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {MANUFACTURERS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {manufacturer === "Other" && (
                    <Input placeholder="Custom manufacturer" value={customManufacturer} onChange={(e) => setCustomManufacturer(e.target.value)} className="mt-1" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Model *</Label>
                  <Input placeholder="e.g. VF-2, DMU 50" value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Machine Type *</Label>
                  <Select value={machineType} onValueChange={setMachineType}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {MACHINE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Platform Category *</Label>
                  <Select value={platformCategory} onValueChange={setPlatformCategory}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {PLATFORM_CATEGORIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Envelope */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Manufacturing Envelope</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Max X Travel (mm)</Label>
                  <Input type="number" value={maxX} onChange={(e) => setMaxX(e.target.value)} placeholder="e.g. 762" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Y Travel (mm)</Label>
                  <Input type="number" value={maxY} onChange={(e) => setMaxY(e.target.value)} placeholder="e.g. 508" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Z Travel (mm)</Label>
                  <Input type="number" value={maxZ} onChange={(e) => setMaxZ(e.target.value)} placeholder="e.g. 508" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Part Weight (lbs)</Label>
                  <Input type="number" value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} placeholder="e.g. 1360" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Part Length (mm)</Label>
                  <Input type="number" value={maxLength} onChange={(e) => setMaxLength(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Part Width (mm)</Label>
                  <Input type="number" value={maxWidth} onChange={(e) => setMaxWidth(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Part Height (mm)</Label>
                  <Input type="number" value={maxHeight} onChange={(e) => setMaxHeight(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Typical Tolerance (in)</Label>
                  <Input type="number" step="0.0001" value={tolerance} onChange={(e) => setTolerance(e.target.value)} placeholder="e.g. 0.001" />
                </div>
              </div>
            </section>

            {/* Capability Flags */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Capabilities</h4>
              <div className="grid grid-cols-3 gap-y-3 gap-x-4">
                {[
                  { label: "5-Axis Simultaneous", value: fiveAxis, set: setFiveAxis },
                  { label: "4th Axis", value: fourthAxis, set: setFourthAxis },
                  { label: "Live Tooling", value: liveTooling, set: setLiveTooling },
                  { label: "Y-Axis Turn", value: yAxisTurn, set: setYAxisTurn },
                  { label: "Sub Spindle", value: subSpindle, set: setSubSpindle },
                  { label: "Probing", value: probingFlag, set: setProbingFlag },
                  { label: "Through-Spindle Coolant", value: tsc, set: setTsc },
                  { label: "Pallet Pool", value: palletPool, set: setPalletPool },
                  { label: "Bar Feeder", value: barFeeder, set: setBarFeeder },
                ].map((cap) => (
                  <div key={cap.label} className="flex items-center gap-2">
                    <Switch checked={cap.value} onCheckedChange={cap.set} />
                    <Label className="text-xs cursor-pointer">{cap.label}</Label>
                  </div>
                ))}
              </div>
            </section>

            {/* Materials */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Material Capability</h4>
              <div className="flex flex-wrap gap-2">
                {MATERIALS.map((mat) => (
                  <Badge
                    key={mat}
                    variant={selectedMaterials.includes(mat) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleMaterial(mat)}
                  >
                    {mat}
                  </Badge>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            {existingProfile ? "Update" : "Save"} Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
