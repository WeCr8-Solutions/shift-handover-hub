import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus } from "lucide-react";

interface AddDimensionFormProps {
  routingStepId: string;
  onAdd: (stepId: string, req: {
    dimension_name: string;
    nominal_value: number;
    upper_tolerance: number;
    lower_tolerance: number;
    unit?: string;
    is_critical?: boolean;
    notes?: string;
  }) => Promise<{ error: string | null }>;
  onCancel: () => void;
}

export function AddDimensionForm({ routingStepId, onAdd, onCancel }: AddDimensionFormProps) {
  const [name, setName] = useState("");
  const [nominal, setNominal] = useState("");
  const [upperTol, setUpperTol] = useState("0.005");
  const [lowerTol, setLowerTol] = useState("0.005");
  const [unit, setUnit] = useState("in");
  const [isCritical, setIsCritical] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !nominal) return;
    setSaving(true);
    const { error } = await onAdd(routingStepId, {
      dimension_name: name.trim(),
      nominal_value: parseFloat(nominal),
      upper_tolerance: parseFloat(upperTol) || 0.005,
      lower_tolerance: parseFloat(lowerTol) || 0.005,
      unit,
      is_critical: isCritical,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    if (!error) {
      setName("");
      setNominal("");
      setUpperTol("0.005");
      setLowerTol("0.005");
      setIsCritical(false);
      setNotes("");
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Dimension Name</Label>
          <Input
            placeholder="e.g. OD Bore, Length, Slot Width"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nominal Value</Label>
          <Input
            type="number"
            step="any"
            placeholder="2.5000"
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Unit</Label>
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="h-8 text-sm"
            placeholder="in"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">+ Upper Tol</Label>
          <Input
            type="number"
            step="any"
            value={upperTol}
            onChange={(e) => setUpperTol(e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">- Lower Tol</Label>
          <Input
            type="number"
            step="any"
            value={lowerTol}
            onChange={(e) => setLowerTol(e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={isCritical} onCheckedChange={setIsCritical} id="critical-dim" />
          <Label htmlFor="critical-dim" className="text-xs cursor-pointer">Critical dimension</Label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={saving || !name.trim() || !nominal} className="gap-1">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add Dimension
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
