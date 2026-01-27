import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Factory, Cog, AlertTriangle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";

export function ManufacturingSettings() {
  const { toast } = useToast();
  const { getSetting, updateSetting, loading } = useAppSettings();
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    // Production defaults
    defaultCycleTimeMinutes: 60,
    defaultSetupTimeMinutes: 30,
    defaultFirstArticleRequired: true,
    defaultQaSignoffRequired: false,
    
    // Quality tracking
    trackScrapByDefault: true,
    trackReworkByDefault: true,
    scrapReasonRequired: true,
    reworkReasonRequired: true,
    
    // Handoff settings
    requireSupervisorSignoff: false,
    requireIncomingConfirmation: true,
    handoffReminderMinutes: 15,
    
    // Delay codes
    enableDelayCodes: true,
    requireDelayCode: true,
    
    // Work order settings
    workOrderPrefix: "WO",
    partNumberFormat: "alphanumeric",
    autoGenerateWorkOrders: false,
    
    // Performance tracking
    enablePerformanceUpdates: true,
    requireEngineeringReview: false,
    performanceUpdateCategories: ["process_improvement", "safety", "quality", "tooling"],
  });

  useEffect(() => {
    const mfgSettings = getSetting("manufacturing_preferences");
    if (mfgSettings) {
      setSettings(prev => ({ ...prev, ...mfgSettings }));
    }
  }, [getSetting]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateSetting("manufacturing_preferences", settings, "manufacturing");
    setIsSaving(false);

    if (error) {
      toast({ title: "Failed to save settings", description: error, variant: "destructive" });
    } else {
      toast({ title: "Settings saved", description: "Manufacturing settings have been updated." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cog className="w-5 h-5" />
            Production Defaults
          </CardTitle>
          <CardDescription>
            Default settings for new work orders and production runs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Cycle Time (minutes)</Label>
              <Input
                type="number"
                min={1}
                value={settings.defaultCycleTimeMinutes}
                onChange={(e) => setSettings(p => ({ ...p, defaultCycleTimeMinutes: parseInt(e.target.value) || 60 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Setup Time (minutes)</Label>
              <Input
                type="number"
                min={1}
                value={settings.defaultSetupTimeMinutes}
                onChange={(e) => setSettings(p => ({ ...p, defaultSetupTimeMinutes: parseInt(e.target.value) || 30 }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>First Article Inspection Required</Label>
              <p className="text-sm text-muted-foreground">Require first article before production</p>
            </div>
            <Switch
              checked={settings.defaultFirstArticleRequired}
              onCheckedChange={(v) => setSettings(p => ({ ...p, defaultFirstArticleRequired: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>QA Sign-off Required</Label>
              <p className="text-sm text-muted-foreground">Require QA approval before completion</p>
            </div>
            <Switch
              checked={settings.defaultQaSignoffRequired}
              onCheckedChange={(v) => setSettings(p => ({ ...p, defaultQaSignoffRequired: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Quality Tracking
          </CardTitle>
          <CardDescription>
            Configure scrap and rework tracking settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Track Scrap</Label>
                <p className="text-xs text-muted-foreground">Enable scrap counting</p>
              </div>
              <Switch
                checked={settings.trackScrapByDefault}
                onCheckedChange={(v) => setSettings(p => ({ ...p, trackScrapByDefault: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Track Rework</Label>
                <p className="text-xs text-muted-foreground">Enable rework counting</p>
              </div>
              <Switch
                checked={settings.trackReworkByDefault}
                onCheckedChange={(v) => setSettings(p => ({ ...p, trackReworkByDefault: v }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Scrap Reason</Label>
              <p className="text-sm text-muted-foreground">Operators must provide reason for scrap</p>
            </div>
            <Switch
              checked={settings.scrapReasonRequired}
              onCheckedChange={(v) => setSettings(p => ({ ...p, scrapReasonRequired: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Rework Reason</Label>
              <p className="text-sm text-muted-foreground">Operators must provide reason for rework</p>
            </div>
            <Switch
              checked={settings.reworkReasonRequired}
              onCheckedChange={(v) => setSettings(p => ({ ...p, reworkReasonRequired: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Handoff Settings
          </CardTitle>
          <CardDescription>
            Configure shift handoff requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Supervisor Sign-off</Label>
              <p className="text-sm text-muted-foreground">Supervisor must approve handoffs</p>
            </div>
            <Switch
              checked={settings.requireSupervisorSignoff}
              onCheckedChange={(v) => setSettings(p => ({ ...p, requireSupervisorSignoff: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Incoming Confirmation</Label>
              <p className="text-sm text-muted-foreground">Incoming operator must confirm handoff</p>
            </div>
            <Switch
              checked={settings.requireIncomingConfirmation}
              onCheckedChange={(v) => setSettings(p => ({ ...p, requireIncomingConfirmation: v }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Handoff Reminder (minutes before shift end)</Label>
            <Input
              type="number"
              min={5}
              max={60}
              value={settings.handoffReminderMinutes}
              onChange={(e) => setSettings(p => ({ ...p, handoffReminderMinutes: parseInt(e.target.value) || 15 }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Work Order Settings
          </CardTitle>
          <CardDescription>
            Configure work order numbering and format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Work Order Prefix</Label>
              <Input
                value={settings.workOrderPrefix}
                onChange={(e) => setSettings(p => ({ ...p, workOrderPrefix: e.target.value }))}
                placeholder="WO"
                maxLength={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Part Number Format</Label>
              <Select 
                value={settings.partNumberFormat} 
                onValueChange={(v) => setSettings(p => ({ ...p, partNumberFormat: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphanumeric">Alphanumeric (ABC-123)</SelectItem>
                  <SelectItem value="numeric">Numeric Only (123456)</SelectItem>
                  <SelectItem value="freeform">Free Form</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Delay Codes</Label>
              <p className="text-sm text-muted-foreground">Track delays with standardized codes</p>
            </div>
            <Switch
              checked={settings.enableDelayCodes}
              onCheckedChange={(v) => setSettings(p => ({ ...p, enableDelayCodes: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Delay Code on Hold</Label>
              <p className="text-sm text-muted-foreground">Must select delay code when placing on hold</p>
            </div>
            <Switch
              checked={settings.requireDelayCode}
              onCheckedChange={(v) => setSettings(p => ({ ...p, requireDelayCode: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Manufacturing Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
