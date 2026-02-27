import { useState, useEffect } from "react";
import {
  useStationMachineProfile,
  MANUFACTURERS,
  MACHINE_TYPES,
  PLATFORM_CATEGORIES,
  MATERIALS,
} from "@/hooks/useStationMachineProfile";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorHandling";
import {
  Loader2,
  Cpu,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Ruler,
  Wrench,
  FlaskConical,
} from "lucide-react";

interface Props {
  stationId: string;
  stationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = ["Identity", "Envelope", "Capabilities", "Review & Activate"] as const;

export function StationManufacturerAttach({ stationId, stationName, open, onOpenChange }: Props) {
  const { profile, loading, saveProfile, activateContext, verifyPayment, refreshProfile } =
    useStationMachineProfile(stationId);
  const { organization } = useUserOrganization();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Form state
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [machineType, setMachineType] = useState("");
  const [platformCategory, setPlatformCategory] = useState("");

  // Envelope
  const [maxX, setMaxX] = useState("");
  const [maxY, setMaxY] = useState("");
  const [maxZ, setMaxZ] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [maxWidth, setMaxWidth] = useState("");
  const [maxHeight, setMaxHeight] = useState("");

  // Capabilities
  const [fiveAxis, setFiveAxis] = useState(false);
  const [fourthAxis, setFourthAxis] = useState(false);
  const [liveTooling, setLiveTooling] = useState(false);
  const [yAxisTurn, setYAxisTurn] = useState(false);
  const [subSpindle, setSubSpindle] = useState(false);
  const [probingCap, setProbingCap] = useState(false);
  const [tsc, setTsc] = useState(false);
  const [palletPool, setPalletPool] = useState(false);
  const [barFeeder, setBarFeeder] = useState(false);
  const [materials, setMaterials] = useState<string[]>([]);
  const [tolerance, setTolerance] = useState("");

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      setManufacturer(profile.manufacturer || "");
      setModel(profile.model || "");
      setMachineType(profile.machine_type || "");
      setPlatformCategory(profile.platform_category || "");
      setMaxX(profile.max_x_travel?.toString() || "");
      setMaxY(profile.max_y_travel?.toString() || "");
      setMaxZ(profile.max_z_travel?.toString() || "");
      setMaxWeight(profile.max_part_weight?.toString() || "");
      setMaxLength(profile.max_part_envelope_length?.toString() || "");
      setMaxWidth(profile.max_part_envelope_width?.toString() || "");
      setMaxHeight(profile.max_part_envelope_height?.toString() || "");
      setFiveAxis(profile.five_axis_simultaneous);
      setFourthAxis(profile.fourth_axis);
      setLiveTooling(profile.live_tooling);
      setYAxisTurn(profile.y_axis_turn);
      setSubSpindle(profile.sub_spindle);
      setProbingCap(profile.probing);
      setTsc(profile.through_spindle_coolant);
      setPalletPool(profile.pallet_pool);
      setBarFeeder(profile.bar_feeder);
      setMaterials(profile.material_capability || []);
      setTolerance(profile.typical_tolerance?.toString() || "");
    }
  }, [profile]);

  const toggleMaterial = (mat: string) => {
    setMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const numOrNull = (v: string) => (v ? parseFloat(v) : null);

  const handleSave = async () => {
    if (!manufacturer || !machineType || !platformCategory) {
      toast({ title: "Missing fields", description: "Manufacturer, type, and platform are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await saveProfile({
      station_id: stationId,
      manufacturer,
      model: model || null,
      machine_type: machineType,
      platform_category: platformCategory,
      max_x_travel: numOrNull(maxX),
      max_y_travel: numOrNull(maxY),
      max_z_travel: numOrNull(maxZ),
      max_part_weight: numOrNull(maxWeight),
      max_part_envelope_length: numOrNull(maxLength),
      max_part_envelope_width: numOrNull(maxWidth),
      max_part_envelope_height: numOrNull(maxHeight),
      five_axis_simultaneous: fiveAxis,
      fourth_axis: fourthAxis,
      live_tooling: liveTooling,
      y_axis_turn: yAxisTurn,
      sub_spindle: subSpindle,
      probing: probingCap,
      through_spindle_coolant: tsc,
      pallet_pool: palletPool,
      bar_feeder: barFeeder,
      material_capability: materials,
      typical_tolerance: numOrNull(tolerance),
      hard_constraints: [],
    });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: getSafeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Profile saved!" });
      setStep(3);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    const activated = await verifyPayment();
    setVerifying(false);
    if (activated) {
      toast({ title: "Context Activated!", description: "AI routing validation is now enabled for this station." });
    } else {
      toast({ title: "Not yet", description: "Payment not found yet. Complete checkout and try again.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent><div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></DialogContent>
      </Dialog>
    );
  }

  const isActivated = profile?.context_active === true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Machine Identity — {stationName}
          </DialogTitle>
          <DialogDescription>
            Attach manufacturer context for AI routing validation.
            {isActivated && (
              <Badge variant="default" className="ml-2 bg-green-600">
                <ShieldCheck className="w-3 h-3 mr-1" /> Active
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <button
                onClick={() => setStep(i)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 0: Identity */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Manufacturer *</Label>
              <Select value={manufacturer} onValueChange={setManufacturer}>
                <SelectTrigger><SelectValue placeholder="Select manufacturer" /></SelectTrigger>
                <SelectContent>
                  {MANUFACTURERS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model (optional)</Label>
              <Input placeholder="e.g. VF-2, DMU 50, Integrex" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Machine Type *</Label>
              <Select value={machineType} onValueChange={setMachineType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {MACHINE_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Platform Category *</Label>
              <Select value={platformCategory} onValueChange={setPlatformCategory}>
                <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_CATEGORIES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 1: Envelope */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Ruler className="w-4 h-4" /> Travel Envelope (mm)
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">X Travel</Label><Input type="number" placeholder="mm" value={maxX} onChange={(e) => setMaxX(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Y Travel</Label><Input type="number" placeholder="mm" value={maxY} onChange={(e) => setMaxY(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Z Travel</Label><Input type="number" placeholder="mm" value={maxZ} onChange={(e) => setMaxZ(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-4">
              <Ruler className="w-4 h-4" /> Max Part Envelope
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Max Weight (lbs)</Label><Input type="number" placeholder="lbs" value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Max Length (mm)</Label><Input type="number" placeholder="mm" value={maxLength} onChange={(e) => setMaxLength(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Max Width (mm)</Label><Input type="number" placeholder="mm" value={maxWidth} onChange={(e) => setMaxWidth(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Max Height (mm)</Label><Input type="number" placeholder="mm" value={maxHeight} onChange={(e) => setMaxHeight(e.target.value)} /></div>
            </div>
            <div className="space-y-2 mt-4">
              <Label>Typical Tolerance (inches)</Label>
              <Input type="number" step="0.0001" placeholder="e.g. 0.001" value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 2: Capabilities */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wrench className="w-4 h-4" /> Capability Flags
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "5-Axis Simultaneous", val: fiveAxis, set: setFiveAxis },
                { label: "4th Axis", val: fourthAxis, set: setFourthAxis },
                { label: "Live Tooling", val: liveTooling, set: setLiveTooling },
                { label: "Y-Axis Turn", val: yAxisTurn, set: setYAxisTurn },
                { label: "Sub Spindle", val: subSpindle, set: setSubSpindle },
                { label: "Probing", val: probingCap, set: setProbingCap },
                { label: "Through Spindle Coolant", val: tsc, set: setTsc },
                { label: "Pallet Pool", val: palletPool, set: setPalletPool },
                { label: "Bar Feeder", val: barFeeder, set: setBarFeeder },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex items-center space-x-2">
                  <Checkbox checked={val} onCheckedChange={(c) => set(c === true)} id={label} />
                  <Label htmlFor={label} className="text-sm cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-4">
              <FlaskConical className="w-4 h-4" /> Material Capability
            </div>
            <div className="flex flex-wrap gap-2">
              {MATERIALS.map((mat) => (
                <Badge
                  key={mat}
                  variant={materials.includes(mat) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleMaterial(mat)}
                >
                  {mat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Review & Activate */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Machine Identity Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Manufacturer:</span> <strong>{manufacturer}</strong></div>
                  <div><span className="text-muted-foreground">Model:</span> <strong>{model || "—"}</strong></div>
                  <div><span className="text-muted-foreground">Type:</span> <strong>{machineType}</strong></div>
                  <div><span className="text-muted-foreground">Platform:</span> <strong>{platformCategory}</strong></div>
                </div>
                {tolerance && (
                  <div><span className="text-muted-foreground">Tolerance:</span> <strong>±{tolerance}"</strong></div>
                )}
                {materials.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {materials.map((m) => <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>

            {!isActivated && profile && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Activate AI Routing Context — $0.99</p>
                      <p className="text-xs text-muted-foreground">One-time payment per station. Enables manufacturer-backed routing validation.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={activateContext} className="gap-2">
                      <CreditCard className="w-4 h-4" /> Pay $0.99 & Activate
                    </Button>
                    <Button variant="outline" onClick={handleVerify} disabled={verifying}>
                      {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Payment"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isActivated && (
              <Card className="border-green-500/50 bg-green-500/5">
                <CardContent className="pt-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-700">Routing Context Active</p>
                    <p className="text-xs text-muted-foreground">
                      AI will use this machine's capabilities for routing validation and reroute suggestions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            {step < 2 && (
              <Button onClick={() => setStep(step + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save & Review"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
