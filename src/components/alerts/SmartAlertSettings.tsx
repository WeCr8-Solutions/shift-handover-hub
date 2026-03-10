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
  BellRing, AlertTriangle, Clock, Pause, Timer,
  Zap, Users, GitBranch, Package, AlertCircle, Save, RotateCcw,
} from "lucide-react";
import type { SmartAlertThresholds } from "@/hooks/useSmartAlerts";
import { DEFAULT_THRESHOLDS } from "@/hooks/useSmartAlerts";

interface SmartAlertSettingsProps {
  thresholds: SmartAlertThresholds;
  onSave: (next: Partial<SmartAlertThresholds>) => Promise<void>;
}

const ALERT_TYPES = [
  { key: "enableOverdue" as const, icon: AlertTriangle, label: "Overdue Work Orders", desc: "Alert when WOs pass their due date", color: "text-status-critical" },
  { key: "enableOnHold" as const, icon: Pause, label: "On Hold Work Orders", desc: "Alert when WOs are paused", color: "text-warning" },
  { key: "enableStale" as const, icon: Clock, label: "Stale Work Orders", desc: "Alert when WOs sit without movement", color: "text-priority-urgent" },
  { key: "enableOverTime" as const, icon: Timer, label: "Over Estimated Time", desc: "Alert when WOs exceed planned duration", color: "text-warning" },
  { key: "enableHighPriority" as const, icon: Zap, label: "High Priority Waiting", desc: "Critical/urgent WOs stuck in queue", color: "text-status-critical" },
  { key: "enableNoOperator" as const, icon: Users, label: "No Operator Assigned", desc: "In-progress WOs missing an operator", color: "text-role-org-owner" },
  { key: "enableBottleneck" as const, icon: GitBranch, label: "Station Bottleneck", desc: "Stations with too many queued WOs", color: "text-priority-urgent" },
  { key: "enableUnassigned" as const, icon: Package, label: "Unassigned Work Orders", desc: "WOs without a station assignment", color: "text-muted-foreground" },
  { key: "enableNoRouting" as const, icon: AlertCircle, label: "No Routing Defined", desc: "Active WOs missing routing steps", color: "text-muted-foreground" },
] as const;

export function SmartAlertSettings({ thresholds, onSave }: SmartAlertSettingsProps) {
  const [local, setLocal] = useState<SmartAlertThresholds>(thresholds);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setLocal(thresholds); }, [thresholds]);

  const isDirty = JSON.stringify(local) !== JSON.stringify(thresholds);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(local); toast.success("Alert settings saved"); }
    catch { toast.error("Failed to save alert settings"); }
    finally { setSaving(false); }
  };

  const numField = (label: string, field: keyof SmartAlertThresholds, min: number, max: number, hint: string) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={min} max={max} value={local[field] as number}
        onChange={(e) => setLocal((p) => ({ ...p, [field]: Number(e.target.value) || min }))} className="h-8" />
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );

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
            <Button variant="outline" size="sm" onClick={() => setLocal(DEFAULT_THRESHOLDS)} disabled={saving}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Defaults
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
              <Save className="w-3.5 h-3.5 mr-1" /> {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-3">Thresholds</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {numField("Stale Warning (days)", "staleDays", 1, 30, "WOs without status change trigger warning")}
            {numField("Stale Critical (days)", "staleCriticalDays", 1, 60, "Escalates to critical severity")}
            {numField("Over-Time Warning (%)", "overTimePct", 0, 500, "% over estimated before alert triggers")}
            {numField("Over-Time Critical (%)", "overTimeCriticalPct", 0, 1000, "Escalates to critical (e.g., 100 = 2× estimate)")}
            {numField("Bottleneck Min WOs", "bottleneckMinWOs", 2, 20, "Minimum queued WOs at a station to flag bottleneck")}
          </div>
        </div>
        <Separator />
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
                <Switch checked={local[key]} onCheckedChange={(checked) => setLocal((p) => ({ ...p, [key]: checked }))} />
              </div>
            ))}
          </div>
        </div>
        {isDirty && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">Unsaved</Badge>
            <span className="text-xs text-muted-foreground">Changes will apply org-wide when saved</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
