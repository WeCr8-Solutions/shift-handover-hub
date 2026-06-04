import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertOctagon, Plus, Trash2, Loader2 } from "lucide-react";
import { useDowntimeReasons } from "@/hooks/useDowntimeReasons";
import { DEFAULT_DOWNTIME_REASONS } from "@/lib/downtimeReasons";
import { toast } from "sonner";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "machine", label: "Machine" },
  { value: "material", label: "Material" },
  { value: "tooling", label: "Tooling" },
  { value: "quality", label: "Quality" },
  { value: "people", label: "People" },
  { value: "process", label: "Process" },
  { value: "other", label: "Other" },
];

export function DowntimeReasonsCard() {
  const { reasons, loading, create, remove } = useDowntimeReasons();
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState<string>("other");
  const [working, setWorking] = useState(false);

  const isCustom = (r: { id: string }) => !r.id.startsWith("default:");

  async function handleAdd() {
    if (!newCode.trim() || !newLabel.trim()) {
      toast.error("Code and label are required");
      return;
    }
    setWorking(true);
    const { error } = await create({
      code: newCode.trim().toLowerCase().replace(/\s+/g, "_"),
      label: newLabel.trim(),
      category: newCategory as any,
    });
    setWorking(false);
    if (error) toast.error(error);
    else {
      toast.success("Reason added");
      setNewCode("");
      setNewLabel("");
      setNewCategory("other");
    }
  }

  async function seedDefaults() {
    setWorking(true);
    let errs = 0;
    for (const r of DEFAULT_DOWNTIME_REASONS) {
      const exists = reasons.find((x) => x.code === r.code && isCustom(x));
      if (exists) continue;
      const { error } = await create(r);
      if (error) errs++;
    }
    setWorking(false);
    if (errs > 0) toast.error(`${errs} defaults failed to import`);
    else toast.success("Default reasons imported");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5" />
          Downtime Reason Taxonomy
        </CardTitle>
        <CardDescription>
          Standardize how operators classify downtime so Pareto analytics can
          surface the biggest losses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="rounded-md border border-border max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs">
                  <tr>
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Label</th>
                    <th className="text-left p-2">Category</th>
                    <th className="p-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {reasons.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-2 font-mono text-xs">{r.code}</td>
                      <td className="p-2">{r.label}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-[10px]">
                          {r.category}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        {isCustom(r) ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={async () => {
                              const { error } = await remove(r.id);
                              if (error) toast.error(error);
                              else toast.success("Removed");
                            }}
                            aria-label={`Remove ${r.label}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">default</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Code</Label>
                <Input
                  placeholder="awaiting_inspection"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Label</Label>
                <Input
                  placeholder="Awaiting Inspection"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={working} className="gap-1.5">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </Button>
            </div>

            {reasons.every((r) => !isCustom(r)) && (
              <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground flex items-center justify-between gap-2">
                <span>Using built-in defaults. Import them to customize.</span>
                <Button variant="outline" size="sm" onClick={seedDefaults} disabled={working}>
                  Import defaults
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
