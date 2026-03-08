import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BellRing,
  AlertTriangle,
  Clock,
  Pause,
  Timer,
  Zap,
  Users,
  GitBranch,
  Package,
  AlertCircle,
  Save,
  RotateCcw,
} from "lucide-react";
import type { SmartAlertThresholds } from "@/hooks/useSmartAlerts";
import { DEFAULT_THRESHOLDS } from "@/hooks/useSmartAlerts";

interface SmartAlertSettingsProps {
  thresholds: SmartAlertThresholds;
  onSave: (next: Partial<SmartAlertThresholds>) => Promise<void>;
}

const ALERT_TYPES = [
  { key: "enableOverdue" as const, icon: AlertTriangle, label: "Overdue Work Orders", desc: "Alert when WOs pass their due date", color: "text-red-500" },
  { key: "enableOnHold" as const, icon: Pause, label: "On Hold Work Orders", desc: "Alert when WOs are paused", color: "text-amber-500" },
  { key: "enableStale" as const, icon: Clock, label: "Stale Work Orders", desc: "Alert when WOs sit without movement", color: "text-orange-500" },
  { key: "enableOverTime" as const, icon: Timer, label: "Over Estimated Time", desc: "Alert when WOs exceed planned duration", color: "text-amber-600" },
  { key: "enableHighPriority" as const, icon: Zap, label: "High Priority Waiting", desc: "Critical/urgent WOs stuck in queue", color: "text-red-500" },
  { key: "enableNoOperator" as const, icon: Users, label: "No Operator Assigned", desc: "In-progress WOs missing an operator", color: "text-purple-500" },
  { key: "enableBottleneck" as const, icon: GitBranch, label: "Station Bottleneck", desc: "Stations with too many queued WOs", color: "text-orange-500" },
  { key: "enableUnassigned" as const, icon: Package, label: "Unassigned Work Orders", desc: "WOs without a station assignment", color: "text-muted-foreground" },
  { key: "enableNoRouting" as const, icon: AlertCircle, label: "No Routing Defined", desc: "Active WOs missing routing steps", color: "text-muted-foreground" },
] as const;

export function SmartAlertSettings({ thresholds, onSave }: SmartAlertSettingsProps) {
  const [local, setLocal] = useState<SmartAlertThresholds>(thresholds);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(thresholds);
  }, [thresholds]);

  const isDirty = JSON.stringify(local) !== JSON.stringify(thresholds);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(local);
      toast.success("Alert settings saved");
    } catch {
      toast.error("Failed to save alert settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocal(DEFAULT_THRESHOLDS);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base">Smart Alert Configuration</CardTitle>
              <CardDescription>Customize which alerts appear and their trigger thresholds</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Defaults
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
              <Save className="w-3.5 h-3.5 mr-1" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Threshold Inputs */}
        <div>
          <h4 className="text-sm font-medium mb-3">Thresholds</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Stale Warning (days)</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={local.staleDays}
                onChange={(e) => setLocal((p) => ({ ...p, staleDays: Number(e.target.value) || 2 }))}
                className="h-8"
              />
              <p className="text-[10px] text-muted-foreground">WOs without status change trigger warning</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stale Critical (days)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={local.staleCriticalDays}
                onChange={(e) => setLocal((p) => ({ ...p, staleCriticalDays: Number(e.target.value) || 5 }))}
                className="h-8"
              />
              <p className="text-[10px] text-muted-foreground">Escalates to critical severity</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Over-Time Warning (%)</Label>
              <Input
                type="number"
                min={0}
                max={500}
                value={local.overTimePct}
                onChange={(e) => setLocal((p) => ({ ...p, overTimePct: Number(e.target.value) || 0 }))}
                className="h-8"
              />
              <p className="text-[10px] text-muted-foreground">% over estimated before alert triggers</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Over-Time Critical (%)</Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={local.overTimeCriticalPct}
                onChange={(e) => setLocal((p) => ({ ...p, overTimeCriticalPct: Number(e.target.value) || 100 }))}
                className="h-8"
              />
              <p className="text-[10px] text-muted-foreground">Escalates to critical (e.g., 100 = 2× estimate)</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bottleneck Min WOs</Label>
              <Input
                type="number"
                min={2}
                max={20}
                value={local.bottleneckMinWOs}
                onChange={(e) => setLocal((p) => ({ ...p, bottleneckMinWOs: Number(e.target.value) || 3 }))}
                className="h-8"
              />
              <p className="text-[10px] text-muted-foreground">Minimum queued WOs at a station to flag bottleneck</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Toggle Switches */}
        <div>
          <h4 className="text-sm font-medium mb-3">Alert Types</h4>
          <div className="space-y-3">
            {ALERT_TYPES.map(({ key, icon: Icon, label, desc, color }) => (
              <div key={key} className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={cn("w-4 h-4 flex-shrink-0", color)} />
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{label}</span>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <Switch
                  checked={local[key]}
                  onCheckedChange={(checked) => setLocal((p) => ({ ...p, [key]: checked }))}
                />
              </div>
            ))}
          </div>
        </div>

        {isDirty && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
              Unsaved
            </Badge>
            <span className="text-xs text-muted-foreground">
              Changes will apply org-wide when saved
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
