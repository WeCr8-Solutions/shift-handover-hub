import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TolRow {
  id: number;
  name: string;
  nominal: string;
  upper: string;
  lower: string;
  measured: string;
}

let nextId = 1;

export function ToleranceCalculator() {
  const [bilateral, setBilateral] = useState(true);
  const [rows, setRows] = useState<TolRow[]>([
    { id: nextId++, name: "Feature 1", nominal: "1.000", upper: "0.005", lower: "-0.005", measured: "" },
  ]);

  const addRow = () => {
    setRows([...rows, { id: nextId++, name: `Feature ${rows.length + 1}`, nominal: "", upper: "", lower: "", measured: "" }]);
  };

  const removeRow = (id: number) => setRows(rows.filter((r) => r.id !== id));

  const updateRow = (id: number, field: keyof TolRow, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // Compute for bilateral: lower = -upper when toggle is on
  const getResults = (row: TolRow) => {
    const nom = parseFloat(row.nominal) || 0;
    const upper = parseFloat(row.upper) || 0;
    const lower = bilateral ? -upper : parseFloat(row.lower) || 0;
    const max = nom + upper;
    const min = nom + lower;
    const range = max - min;
    const mid = (max + min) / 2;
    const meas = row.measured ? parseFloat(row.measured) : null;
    let status: "pass" | "warn" | "fail" | null = null;
    if (meas !== null) {
      if (meas >= min && meas <= max) {
        const margin = Math.min(meas - min, max - meas);
        status = margin < range * 0.1 ? "warn" : "pass";
      } else {
        status = "fail";
      }
    }
    return { nom, upper, lower, max, min, range, mid, meas, status };
  };

  // Total stackup
  const totalRange = rows.reduce((sum, r) => sum + getResults(r).range, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch checked={bilateral} onCheckedChange={setBilateral} />
        <Label className="text-xs">Bilateral (± symmetric) tolerance</Label>
      </div>

      {rows.map((row) => {
        const r = getResults(row);
        return (
          <div key={row.id} className="border rounded-lg p-3 space-y-2 bg-card">
            <div className="flex items-center justify-between">
              <Input
                value={row.name}
                onChange={(e) => updateRow(row.id, "name", e.target.value)}
                className="h-7 text-xs font-medium border-none shadow-none px-0 w-auto"
              />
              {rows.length > 1 && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(row.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              )}
            </div>
            <div className={cn("grid gap-2", bilateral ? "grid-cols-3" : "grid-cols-4")}>
              <div>
                <Label className="text-[10px]">Nominal</Label>
                <Input value={row.nominal} onChange={(e) => updateRow(row.id, "nominal", e.target.value)} type="number" step="0.001" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">{bilateral ? "± Tolerance" : "Upper Tol"}</Label>
                <Input value={row.upper} onChange={(e) => updateRow(row.id, "upper", e.target.value)} type="number" step="0.001" className="h-8 text-xs" />
              </div>
              {!bilateral && (
                <div>
                  <Label className="text-[10px]">Lower Tol</Label>
                  <Input value={row.lower} onChange={(e) => updateRow(row.id, "lower", e.target.value)} type="number" step="0.001" className="h-8 text-xs" />
                </div>
              )}
              <div>
                <Label className="text-[10px]">Measured</Label>
                <Input
                  value={row.measured}
                  onChange={(e) => updateRow(row.id, "measured", e.target.value)}
                  type="number"
                  step="0.0001"
                  placeholder="—"
                  className={cn("h-8 text-xs", r.status === "pass" && "border-status-ok", r.status === "warn" && "border-warning", r.status === "fail" && "border-destructive")}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>Max: <strong>{r.max.toFixed(4)}</strong></span>
              <span>Min: <strong>{r.min.toFixed(4)}</strong></span>
              <span>Range: <strong>{r.range.toFixed(4)}</strong></span>
              {r.status && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] ml-auto",
                    r.status === "pass" && "bg-green-500/10 text-green-700 border-green-500/30",
                    r.status === "warn" && "bg-amber-500/10 text-amber-700 border-amber-500/30",
                    r.status === "fail" && "bg-destructive/10 text-destructive border-destructive/30"
                  )}
                >
                  {r.status === "pass" ? "✓ PASS" : r.status === "warn" ? "⚠ NEAR LIMIT" : "✕ FAIL"}
                </Badge>
              )}
            </div>
          </div>
        );
      })}

      <Button variant="outline" size="sm" className="gap-1 text-xs w-full" onClick={addRow}>
        <Plus className="w-3 h-3" /> Add Feature
      </Button>

      {rows.length > 1 && (
        <>
          <Separator />
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Tolerance Stackup</p>
            <p className="text-lg font-bold">{totalRange.toFixed(4)}"</p>
          </div>
        </>
      )}
    </div>
  );
}
