import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Wrench,
  ClipboardList,
  Info,
} from "lucide-react";
import type { SmartAlertThresholds } from "@/hooks/useSmartAlerts";
import { DEFAULT_THRESHOLDS, useSmartAlerts } from "@/hooks/useSmartAlerts";
import { SmartAlertPanel } from "@/components/alerts/SmartAlertPanel";

/* ── Alert type metadata, split into two categories ── */

const WORK_ORDER_ALERTS = [
  { key: "enableOverdue" as const, icon: AlertTriangle, label: "Overdue Work Orders", desc: "Alert when WOs pass their due date", color: "text-destructive" },
  { key: "enableOnHold" as const, icon: Pause, label: "On Hold Work Orders", desc: "Alert when WOs are paused for extended periods", color: "text-amber-500" },
  { key: "enableStale" as const, icon: Clock, label: "Stale Work Orders", desc: "Alert when WOs sit in queue without movement", color: "text-orange-500" },
  { key: "enableOverTime" as const, icon: Timer, label: "Over Estimated Time", desc: "Alert when WOs exceed planned duration", color: "text-amber-600" },
  { key: "enableHighPriority" as const, icon: Zap, label: "High Priority Waiting", desc: "Critical/urgent WOs stuck in queue and not started", color: "text-destructive" },
  { key: "enableNoRouting" as const, icon: AlertCircle, label: "No Routing Defined", desc: "Active WOs missing routing steps", color: "text-muted-foreground" },
  { key: "enableUnassigned" as const, icon: Package, label: "Unassigned Work Orders", desc: "WOs without a station assignment", color: "text-muted-foreground" },
] as const;

const STATION_ALERTS = [
  { key: "enableNoOperator" as const, icon: Users, label: "No Operator Assigned", desc: "In-progress WOs at a station with no checked-in operator", color: "text-purple-500" },
  { key: "enableBottleneck" as const, icon: GitBranch, label: "Station Bottleneck", desc: "Stations with too many queued WOs competing for processing time", color: "text-orange-500" },
] as const;

export function SmartAlertAdmin() {
  const { alerts, thresholds, saveThresholds, loading, refresh } = useSmartAlerts();
  const [local, setLocal] = useState<SmartAlertThresholds>(thresholds);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(thresholds);
  }, [thresholds]);

  const isDirty = JSON.stringify(local) !== JSON.stringify(thresholds);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveThresholds(local);
      toast.success("Alert settings saved for your organization");
    } catch {
      toast.error("Failed to save alert settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setLocal(DEFAULT_THRESHOLDS);

  const woAlerts = alerts.filter(a => a.targetType === "work_order");
  const stationAlerts = alerts.filter(a => a.targetType === "station");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Smart Alert Configuration</CardTitle>
                <CardDescription>
                  Configure which alerts surface for your organization and fine-tune timing thresholds.
                  Changes apply org-wide for all supervisors and operators.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset Defaults
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
                <Save className="w-3.5 h-3.5 mr-1" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isDirty && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
          <Badge variant="outline" className="text-xs border-primary/50 text-primary">Unsaved</Badge>
          <span className="text-sm text-muted-foreground">You have unsaved changes — they will apply org-wide once saved.</span>
        </div>
      )}

      {/* Two-category Tabs */}
      <Tabs defaultValue="work-orders" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="work-orders" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Work Order Alerts
            {woAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{woAlerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stations" className="gap-2">
            <Wrench className="w-4 h-4" />
            Station / Work Center Alerts
            {stationAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{stationAlerts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Work Order Alerts ── */}
        <TabsContent value="work-orders" className="space-y-4">
          {/* Timing thresholds for WO alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                Work Order Timing Thresholds
              </CardTitle>
              <CardDescription className="text-xs">
                Control when work order alerts trigger based on elapsed time and estimated durations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ThresholdInput
                  label="Stale Warning (days)"
                  hint="Days without status change before a warning appears"
                  min={1} max={30}
                  value={local.staleDays}
                  onChange={v => setLocal(p => ({ ...p, staleDays: v }))}
                />
                <ThresholdInput
                  label="Stale Critical (days)"
                  hint="Days without movement before escalating to critical"
                  min={1} max={60}
                  value={local.staleCriticalDays}
                  onChange={v => setLocal(p => ({ ...p, staleCriticalDays: v }))}
                />
                <ThresholdInput
                  label="Over-Time Warning (%)"
                  hint="% past estimated duration before triggering warning"
                  min={0} max={500}
                  value={local.overTimePct}
                  onChange={v => setLocal(p => ({ ...p, overTimePct: v }))}
                />
                <ThresholdInput
                  label="Over-Time Critical (%)"
                  hint="% past estimated to escalate to critical (e.g. 100 = 2× estimate)"
                  min={0} max={1000}
                  value={local.overTimeCriticalPct}
                  onChange={v => setLocal(p => ({ ...p, overTimeCriticalPct: v }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* WO alert toggles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Work Order Alert Types
              </CardTitle>
              <CardDescription className="text-xs">
                Enable or disable individual work order alert categories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {WORK_ORDER_ALERTS.map(({ key, icon: Icon, label, desc, color }) => (
                  <AlertToggleRow
                    key={key}
                    icon={<Icon className={cn("w-4 h-4 flex-shrink-0", color)} />}
                    label={label}
                    desc={desc}
                    checked={local[key]}
                    onChange={checked => setLocal(p => ({ ...p, [key]: checked }))}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                Live Work Order Alerts
              </CardTitle>
              <CardDescription className="text-xs">
                Current alerts based on your saved thresholds. Changes above won't reflect here until saved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {woAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active work order alerts — your floor is running clean.</p>
              ) : (
                <SmartAlertPanel alerts={woAlerts} loading={loading} maxVisible={6} variant="full" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Station / Work Center Alerts ── */}
        <TabsContent value="stations" className="space-y-4">
          {/* Station-specific thresholds */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                Station / Work Center Thresholds
              </CardTitle>
              <CardDescription className="text-xs">
                Control when station-level alerts trigger based on queue depth and operator assignments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ThresholdInput
                  label="Bottleneck Min WOs"
                  hint="Minimum queued WOs at a station before flagging as bottleneck"
                  min={2} max={20}
                  value={local.bottleneckMinWOs}
                  onChange={v => setLocal(p => ({ ...p, bottleneckMinWOs: v }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Station alert toggles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                Station Alert Types
              </CardTitle>
              <CardDescription className="text-xs">
                Enable or disable station and work center alert categories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {STATION_ALERTS.map(({ key, icon: Icon, label, desc, color }) => (
                  <AlertToggleRow
                    key={key}
                    icon={<Icon className={cn("w-4 h-4 flex-shrink-0", color)} />}
                    label={label}
                    desc={desc}
                    checked={local[key]}
                    onChange={checked => setLocal(p => ({ ...p, [key]: checked }))}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                Live Station Alerts
              </CardTitle>
              <CardDescription className="text-xs">
                Current station-level alerts based on your saved thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stationAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active station alerts — all stations operating normally.</p>
              ) : (
                <SmartAlertPanel alerts={stationAlerts} loading={loading} maxVisible={6} variant="full" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Reusable sub-components ── */

function ThresholdInput({ label, hint, min, max, value, onChange }: {
  label: string;
  hint: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value) || min)}
        className="h-8"
      />
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function AlertToggleRow({ icon, label, desc, checked, onChange }: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {icon}
        <div className="min-w-0">
          <span className="text-sm font-medium">{label}</span>
          <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
