import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import {
  MANUFACTURERS,
  MACHINE_TYPES,
  STATION_CATEGORIES,
  SPINDLE_TAPERS,
  CONTROL_TYPES,
} from "@/hooks/useStationMachineProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  "Aluminum", "Steel", "Stainless Steel", "Titanium", "Inconel",
  "Copper", "Brass", "Plastics", "Composites", "Cast Iron", "Tool Steel", "Other",
] as const;

interface ManualMachineProfile {
  id?: string;
  manufacturer: string;
  model: string;
  machine_type: string;
  platform_category: string;
  serial_number?: string | null;
  asset_tag?: string | null;
  station_category?: string;
  year_installed?: number | null;
  notes?: string | null;
  max_x_travel?: number | null;
  max_y_travel?: number | null;
  max_z_travel?: number | null;
  max_part_weight?: number | null;
  max_part_envelope_length?: number | null;
  max_part_envelope_width?: number | null;
  max_part_envelope_height?: number | null;
  five_axis_simultaneous?: boolean;
  fourth_axis?: boolean;
  live_tooling?: boolean;
  y_axis_turn?: boolean;
  sub_spindle?: boolean;
  probing?: boolean;
  through_spindle_coolant?: boolean;
  pallet_pool?: boolean;
  bar_feeder?: boolean;
  material_capability?: string[];
  typical_tolerance?: number | null;
  max_spindle_rpm?: number | null;
  spindle_taper?: string | null;
  spindle_power_hp?: number | null;
  tool_magazine_capacity?: number | null;
  max_tool_diameter?: number | null;
  max_tool_length?: number | null;
  control_type?: string | null;
  control_model?: string | null;
  max_turning_diameter?: number | null;
  max_turning_length?: number | null;
  bar_capacity_mm?: number | null;
  [key: string]: unknown;
}

interface Props {
  stationId: string;
  stationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProfile?: ManualMachineProfile;
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
  const [stationCategory, setStationCategory] = useState("cnc_machine");
  const [manufacturer, setManufacturer] = useState("");
  const [customManufacturer, setCustomManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [machineType, setMachineType] = useState("");
  const [platformCategory, setPlatformCategory] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [yearInstalled, setYearInstalled] = useState("");
  const [notes, setNotes] = useState("");
  const [maxX, setMaxX] = useState("");
  const [maxY, setMaxY] = useState("");
  const [maxZ, setMaxZ] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [maxWidth, setMaxWidth] = useState("");
  const [maxHeight, setMaxHeight] = useState("");
  const [fiveAxis, setFiveAxis] = useState(false);
  const [fourthAxis, setFourthAxis] = useState(false);
  const [liveTooling, setLiveTooling] = useState(false);
  const [yAxisTurn, setYAxisTurn] = useState(false);
  const [subSpindle, setSubSpindle] = useState(false);
  const [probingFlag, setProbingFlag] = useState(false);
  const [tsc, setTsc] = useState(false);
  const [palletPool, setPalletPool] = useState(false);
  const [barFeeder, setBarFeeder] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [tolerance, setTolerance] = useState("");
  // New spec fields
  const [maxSpindleRpm, setMaxSpindleRpm] = useState("");
  const [spindleTaper, setSpindleTaper] = useState("");
  const [spindlePowerHp, setSpindlePowerHp] = useState("");
  const [toolMagCapacity, setToolMagCapacity] = useState("");
  const [maxToolDiameter, setMaxToolDiameter] = useState("");
  const [maxToolLength, setMaxToolLength] = useState("");
  const [controlType, setControlType] = useState("");
  const [controlModel, setControlModel] = useState("");
  const [maxTurningDiameter, setMaxTurningDiameter] = useState("");
  const [maxTurningLength, setMaxTurningLength] = useState("");
  const [barCapacity, setBarCapacity] = useState("");

  const isMachineType = ["cnc_machine", "welding"].includes(stationCategory);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStationCategory(existingProfile?.station_category || "cnc_machine");
      setManufacturer(existingProfile?.manufacturer || "");
      setCustomManufacturer("");
      setModel(existingProfile?.model || "");
      setMachineType(existingProfile?.machine_type || "");
      setPlatformCategory(existingProfile?.platform_category || "");
      setSerialNumber(existingProfile?.serial_number || "");
      setAssetTag(existingProfile?.asset_tag || "");
      setYearInstalled(existingProfile?.year_installed?.toString() || "");
      setNotes(existingProfile?.notes || "");
      setMaxX(existingProfile?.max_x_travel?.toString() || "");
      setMaxY(existingProfile?.max_y_travel?.toString() || "");
      setMaxZ(existingProfile?.max_z_travel?.toString() || "");
      setMaxWeight(existingProfile?.max_part_weight?.toString() || "");
      setMaxLength(existingProfile?.max_part_envelope_length?.toString() || "");
      setMaxWidth(existingProfile?.max_part_envelope_width?.toString() || "");
      setMaxHeight(existingProfile?.max_part_envelope_height?.toString() || "");
      setFiveAxis(existingProfile?.five_axis_simultaneous || false);
      setFourthAxis(existingProfile?.fourth_axis || false);
      setLiveTooling(existingProfile?.live_tooling || false);
      setYAxisTurn(existingProfile?.y_axis_turn || false);
      setSubSpindle(existingProfile?.sub_spindle || false);
      setProbingFlag(existingProfile?.probing || false);
      setTsc(existingProfile?.through_spindle_coolant || false);
      setPalletPool(existingProfile?.pallet_pool || false);
      setBarFeeder(existingProfile?.bar_feeder || false);
      setSelectedMaterials(existingProfile?.material_capability || []);
      setTolerance(existingProfile?.typical_tolerance?.toString() || "");
      setMaxSpindleRpm(existingProfile?.max_spindle_rpm?.toString() || "");
      setSpindleTaper(existingProfile?.spindle_taper || "");
      setSpindlePowerHp(existingProfile?.spindle_power_hp?.toString() || "");
      setToolMagCapacity(existingProfile?.tool_magazine_capacity?.toString() || "");
      setMaxToolDiameter(existingProfile?.max_tool_diameter?.toString() || "");
      setMaxToolLength(existingProfile?.max_tool_length?.toString() || "");
      setControlType(existingProfile?.control_type || "");
      setControlModel(existingProfile?.control_model || "");
      setMaxTurningDiameter(existingProfile?.max_turning_diameter?.toString() || "");
      setMaxTurningLength(existingProfile?.max_turning_length?.toString() || "");
      setBarCapacity(existingProfile?.bar_capacity_mm?.toString() || "");
    }
  }, [open, existingProfile]);

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) => (prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]));
  };

  const parseNumber = (value: string): number | null => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };
  const parseInt_ = (value: string): number | null => {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  };

  const handleSave = async () => {
    if (!user || !organization) {
      toast({ title: "Not authorized", description: "Please log in and select an organization.", variant: "destructive" });
      return;
    }

    const mfg = manufacturer === "Other" ? customManufacturer : manufacturer;

    // For machine types, require full identity. For non-machine, just need manufacturer/model as labels
    if (isMachineType && (!mfg || !model || !machineType || !platformCategory)) {
      toast({ title: "Missing fields", description: "Manufacturer, Model, Machine Type, and Platform are required for machines.", variant: "destructive" });
      return;
    }
    if (!isMachineType && !model) {
      toast({ title: "Missing fields", description: "Please provide a name/model for this station.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload: any = {
      station_id: stationId,
      organization_id: organization.id,
      created_by: user.id,
      station_category: stationCategory,
      manufacturer: mfg || "N/A",
      model,
      machine_type: machineType || stationCategory,
      platform_category: platformCategory || "N/A",
      serial_number: serialNumber || null,
      asset_tag: assetTag || null,
      year_installed: parseInt_(yearInstalled),
      notes: notes || null,
      max_x_travel: parseNumber(maxX),
      max_y_travel: parseNumber(maxY),
      max_z_travel: parseNumber(maxZ),
      max_part_weight: parseNumber(maxWeight),
      max_part_envelope_length: parseNumber(maxLength),
      max_part_envelope_width: parseNumber(maxWidth),
      max_part_envelope_height: parseNumber(maxHeight),
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
      typical_tolerance: parseNumber(tolerance),
      hard_constraints: [],
      max_spindle_rpm: parseNumber(maxSpindleRpm),
      spindle_taper: spindleTaper || null,
      spindle_power_hp: parseNumber(spindlePowerHp),
      tool_magazine_capacity: parseInt_(toolMagCapacity),
      max_tool_diameter: parseNumber(maxToolDiameter),
      max_tool_length: parseNumber(maxToolLength),
      control_type: controlType || null,
      control_model: controlModel || null,
      max_turning_diameter: parseNumber(maxTurningDiameter),
      max_turning_length: parseNumber(maxTurningLength),
      bar_capacity_mm: parseNumber(barCapacity),
    };

    const { error } = await (existingProfile?.id
      ? supabase.from("station_manual_machine_profiles" as any).update(payload).eq("id", existingProfile.id)
      : supabase.from("station_manual_machine_profiles" as any).insert(payload));

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: getSafeErrorMessage(error), variant: "destructive" });
    } else {
      toast({
        title: existingProfile ? "Profile updated" : "Profile saved",
        description: `Station context for "${stationName}" is now active.`,
      });
      onSaved?.();
      onOpenChange(false);
    }
  };

  const categoryLabel = STATION_CATEGORIES.find((c) => c.value === stationCategory)?.label || stationCategory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Manual Station Entry — {stationName}
          </DialogTitle>
          <DialogDescription>
            Define your station profile. For CNC machines this enables AI routing validation; for other station types it provides context and tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2">
          <div className="space-y-6 pb-4">

            {/* Station Category */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Station Type</h4>
              <div className="space-y-1.5">
                <Label className="text-xs">Category *</Label>
                <Select value={stationCategory} onValueChange={setStationCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select station type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STATION_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  {isMachineType
                    ? "Machine profiles include full CNC specs and routing validation."
                    : `"${categoryLabel}" stations track area context without machine-specific specs.`}
                </p>
              </div>
            </section>

            {/* Identity */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                {isMachineType ? "Machine Identity" : "Station Identity"}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {isMachineType && (
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
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">{isMachineType ? "Model *" : "Name / Label *"}</Label>
                  <Input placeholder={isMachineType ? "e.g. VF-2, DMU 50" : "e.g. Assembly Bench A1"} value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
                {isMachineType && (
                  <>
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
                  </>
                )}
              </div>

              {/* Instance-specific fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Serial Number</Label>
                  <Input placeholder="e.g. SN-2024-0042" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Asset Tag</Label>
                  <Input placeholder="e.g. ASSET-1234" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Year Installed</Label>
                  <Input type="number" placeholder="e.g. 2022" value={yearInstalled} onChange={(e) => setYearInstalled(e.target.value)} />
                </div>
              </div>
            </section>

            {/* Machine-specific sections — only for CNC/machine types */}
            {isMachineType && (
              <>
                {/* Control & Spindle */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Control & Spindle</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Control Type</Label>
                      <Select value={controlType} onValueChange={setControlType}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {CONTROL_TYPES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Control Model</Label>
                      <Input placeholder="e.g. 31i-B5" value={controlModel} onChange={(e) => setControlModel(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Max Spindle RPM</Label>
                      <Input type="number" placeholder="e.g. 12000" value={maxSpindleRpm} onChange={(e) => setMaxSpindleRpm(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Spindle Taper</Label>
                      <Select value={spindleTaper} onValueChange={setSpindleTaper}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {SPINDLE_TAPERS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Spindle Power (HP)</Label>
                      <Input type="number" placeholder="e.g. 30" value={spindlePowerHp} onChange={(e) => setSpindlePowerHp(e.target.value)} />
                    </div>
                  </div>
                </section>

                {/* Tool Capacity */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Tool Capacity</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Magazine Capacity</Label>
                      <Input type="number" placeholder="e.g. 40" value={toolMagCapacity} onChange={(e) => setToolMagCapacity(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Max Tool Diameter (mm)</Label>
                      <Input type="number" placeholder="e.g. 80" value={maxToolDiameter} onChange={(e) => setMaxToolDiameter(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Max Tool Length (mm)</Label>
                      <Input type="number" placeholder="e.g. 300" value={maxToolLength} onChange={(e) => setMaxToolLength(e.target.value)} />
                    </div>
                  </div>
                </section>

                {/* Turning-specific */}
                {["Turn Center (2-Axis)", "Turn/Mill (Y-Axis)", "Swiss"].includes(machineType) && (
                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Turning Specs</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Max Turning Diameter (mm)</Label>
                        <Input type="number" value={maxTurningDiameter} onChange={(e) => setMaxTurningDiameter(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Max Turning Length (mm)</Label>
                        <Input type="number" value={maxTurningLength} onChange={(e) => setMaxTurningLength(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Bar Capacity (mm)</Label>
                        <Input type="number" value={barCapacity} onChange={(e) => setBarCapacity(e.target.value)} />
                      </div>
                    </div>
                  </section>
                )}

                {/* Envelope */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Manufacturing Envelope</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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

                {/* Capabilities */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Capabilities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
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
                    ].map(({ label, value, set }) => (
                      <div key={label} className="flex items-center justify-between gap-2">
                        <Label className="text-xs cursor-pointer">{label}</Label>
                        <Switch checked={value} onCheckedChange={set} />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Materials */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Material Capability</h4>
                  <div className="flex flex-wrap gap-2">
                    {MATERIALS.map((mat) => (
                      <Badge key={mat} variant={selectedMaterials.includes(mat) ? "default" : "outline"} className="cursor-pointer select-none" onClick={() => toggleMaterial(mat)}>
                        {mat}
                      </Badge>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Notes — always visible */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Notes</h4>
              <Textarea placeholder="Any additional details about this station..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </section>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {existingProfile ? "Update Profile" : "Save Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
