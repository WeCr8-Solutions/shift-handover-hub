import { useState, useEffect } from "react";
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

interface ManualMachineProfile {
  id?: string;
  manufacturer: string;
  model: string;
  machine_type: string;
  platform_category: string;
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
  probing?: boolean

  through_spindle_coolant?: boolean;
  pallet_pool?: boolean;
  bar_feeder?: boolean;
  material_capability?: string[];
  typical_tolerance?: number | null;
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

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setManufacturer(existingProfile?.manufacturer || "");
      setCustomManufacturer("");
      setModel(existingProfile?.model || "");
      setMachineType(existingProfile?.machine_type || "");
      setPlatformCategory(existingProfile?.platform_category || "");
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
    }
  }, [open, existingProfile]);

  // Form state
  const [manufacturer, setManufacturer] = useState("");
  const [customManufacturer, setCustomManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [machineType, setMachineType] = useState("");
  const [platformCategory, setPlatformCategory] = useState("");
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

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const parseNumber = (value: string): number | null => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  const handleSave = async () => {
    if (!user || !organization) {
      toast({
        title: "Not authorized",
        description: "Please log in and select an organization.",
        variant: "destructive",
      });
      return;
    }

    const mfg = manufacturer === "Other" ? customManufacturer : manufacturer;
    if (!mfg || !model || !machineType || !platformCategory) {
      toast({
        title: "Missing fields",
        description: "Manufacturer, Model, Machine Type, and Platform are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const payload: any = {
      station_id: stationId,
      organization_id: organization.id,
      created_by: user.id,
      manufacturer: mfg,
      model,
      machine_type: machineType,
      platform_category: platformCategory,
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
    };

    const { error } = await (existingProfile?.id
      ? supabase
          .from("station_manual_machine_profiles" as any)
          .update(payload)
          .eq("id", existingProfile.id)
      : supabase.from("station_manual_machine_profiles" as any).insert(payload)
    );

    setSaving(false);
    if (error) {
      toast({
        title: "Save failed",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: existingProfile ? "Profile updated" : "Profile saved",
        description: `Machine context for "${stationName}" is now active.`,
      });
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
            Enter your machine's specs manually. This data enables AI routing
            validation for this station.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
          <div className="space-y-6 pb-4">
            {/* Machine Identity */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Machine Identity
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Manufacturer *</Label>
                  <Select value={manufacturer} onValueChange={setManufacturer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MANUFACTURERS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {manufacturer === "Other" && (
                    <Input
                      placeholder="Custom manufacturer"
                      value={customManufacturer}
                      onChange={(e) => setCustomManufacturer(e.target.value)}
                      className="mt-1"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Model *</Label>
                  <Input
                    placeholder="e.g. VF-2, DMU 50"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Machine Type *</Label>
                  <Select value={machineType} onValueChange={setMachineType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MACHINE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Platform Category *</Label>
                  <Select
                    value={platformCategory}
                    onValueChange={setPlatformCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_CATEGORIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Envelope */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Manufacturing Envelope
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Max X Travel (mm)</Label>
                  <Input
                    type="number"
                    value={maxX}
                    onChange={(e) => setMaxX(e.target.value)}
                    placeholder="e.g. 762"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Y Travel (mm)</Label>
                  <Input
                    type="number"
                    value={maxY}
                    onChange={(e) => setMaxY(e.target.value)}
                    placeholder="e.g. 508"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Z Travel (mm)</Label>
                  <Input
                    type="number"
                    value={maxZ}
                    onChange={(e) => setMaxZ(e.target.value)}
                    placeholder="e.g. 508"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Part Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={maxWeight}
                    onChange={(e) => setMaxWeight(e.target.value)}
                    placeholder="e.g. 1360"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Part Length (mm)</Label>
                  <Input
                    type="number"
                    value={maxLength}
                    onChange={(e) => setMaxLength(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Part Width (mm)</Label>
                  <Input
                    type="number"
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Part Height (mm)</Label>
                  <Input
                    type="number"
                    value={maxHeight}
                    onChange={(e) => setMaxHeight(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Typical Tolerance (in)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={tolerance}
                    onChange={(e) => setTolerance(e.target.value)}
                    placeholder="e.g. 0.001"
                  />
                </div>
              </div>
            </section>

            {/* Capability Flags */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Capabilities
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
                {[
                  { label: "5-Axis Simultaneous", value: fiveAxis, set: setFiveAxis },
                  { label: "4th Axis", value: fourthAxis, set: setFourthAxis },
                  { label: "Live Tooling", value: liveTooling, set: setLiveTooling },
                  { label: "Y-Axis Turn", value: yAxisTurn, set: setYAxisTurn },
                  { label: "Sub Spindle", value: subSpindle, set: setSubSpindle
