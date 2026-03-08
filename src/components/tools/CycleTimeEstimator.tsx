import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";

interface CutOp {
  id: number;
  name: string;
  length: string;    // in
  feedRate: string;   // IPM
}

let nextId = 1;

export function estimateCycleTime(ops: { length: number; feedRate: number }[], loadUnload: number, toolChanges: number, toolChangeTime: number): {
  cuttingTime: number;
  nonCuttingTime: number;
  totalTime: number;
  partsPerHour: number;
} {
  const cuttingTime = ops.reduce((sum, op) => sum + (op.feedRate > 0 ? op.length / op.feedRate : 0), 0);
  const nonCuttingTime = loadUnload / 60 + (toolChanges * toolChangeTime) / 60;
  const totalTime = cuttingTime + nonCuttingTime;
  const partsPerHour = totalTime > 0 ? 60 / totalTime : 0;
  return { cuttingTime, nonCuttingTime, totalTime, partsPerHour };
}

export function CycleTimeEstimator() {
  const [ops, setOps] = useState<CutOp[]>([
    { id: nextId++, name: "Roughing", length: "6", feedRate: "15" },
    { id: nextId++, name: "Finishing", length: "6", feedRate: "8" },
  ]);
  const [loadUnload, setLoadUnload] = useState("30");       // seconds
  const [toolChanges, setToolChanges] = useState("2");
  const [toolChangeTime, setToolChangeTime] = useState("5"); // seconds

  const addOp = () => setOps([...ops, { id: nextId++, name: `Op ${ops.length + 1}`, length: "", feedRate: "" }]);
  const removeOp = (id: number) => setOps(ops.filter((o) => o.id !== id));
  const updateOp = (id: number, field: keyof CutOp, value: string) =>
    setOps(ops.map((o) => (o.id === id ? { ...o, [field]: value } : o)));

  const result = estimateCycleTime(
    ops.map((o) => ({ length: parseFloat(o.length) || 0, feedRate: parseFloat(o.feedRate) || 0 })),
    parseFloat(loadUnload) || 0,
    parseInt(toolChanges) || 0,
    parseFloat(toolChangeTime) || 0,
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Estimate cycle time from cutting passes and non-cutting time.</p>

      {ops.map((op) => (
        <div key={op.id} className="border rounded-lg p-3 space-y-2 bg-card">
          <div className="flex items-center justify-between">
            <Input
              value={op.name}
              onChange={(e) => updateOp(op.id, "name", e.target.value)}
              className="h-7 text-xs font-medium border-none shadow-none px-0 w-auto"
              maxLength={50}
            />
            {ops.length > 1 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeOp(op.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Cut Length (in)</Label>
              <Input value={op.length} onChange={(e) => updateOp(op.id, "length", e.target.value)} type="number" step="0.1" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Feed Rate (IPM)</Label>
              <Input value={op.feedRate} onChange={(e) => updateOp(op.id, "feedRate", e.target.value)} type="number" step="0.1" className="h-8 text-xs" />
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" className="gap-1 text-xs w-full" onClick={addOp}>
        <Plus className="w-3 h-3" /> Add Operation
      </Button>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-[10px]">Load/Unload (sec)</Label>
          <Input value={loadUnload} onChange={(e) => setLoadUnload(e.target.value)} type="number" className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Tool Changes (#)</Label>
          <Input value={toolChanges} onChange={(e) => setToolChanges(e.target.value)} type="number" className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Change Time (sec)</Label>
          <Input value={toolChangeTime} onChange={(e) => setToolChangeTime(e.target.value)} type="number" className="h-8 text-xs" />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cutting Time</p>
          <p className="text-lg font-bold text-primary">{result.cuttingTime.toFixed(2)} min</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Non-Cutting</p>
          <p className="text-lg font-bold text-primary">{result.nonCuttingTime.toFixed(2)} min</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Cycle</p>
          <p className="text-lg font-bold text-primary">{result.totalTime.toFixed(2)} min</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Parts/Hour</p>
          <p className="text-lg font-bold text-primary">{result.partsPerHour.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}
