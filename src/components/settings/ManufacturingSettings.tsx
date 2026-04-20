import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Factory, Cog, AlertTriangle, Package, FileQuestion } from "lucide-react";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { SettingsSkeleton } from "./SettingsSkeleton";
import { SettingsFooter } from "./SettingsFooter";
import { SettingsSwitchRow } from "./SettingsSwitchRow";

type ManufacturingSettingsState = {
  defaultCycleTimeMinutes: number;
  defaultSetupTimeMinutes: number;
  defaultFirstArticleRequired: boolean;
  defaultQaSignoffRequired: boolean;
  trackScrapByDefault: boolean;
  trackReworkByDefault: boolean;
  scrapReasonRequired: boolean;
  reworkReasonRequired: boolean;
  requireSupervisorSignoff: boolean;
  requireIncomingConfirmation: boolean;
  handoffReminderMinutes: number;
  enableDelayCodes: boolean;
  requireDelayCode: boolean;
  workOrderPrefix: string;
  partNumberFormat: string;
  autoGenerateWorkOrders: boolean;
  enableQuoteSystem: boolean;
  quoteNumberPrefix: string;
  quoteValidityDays: number;
  quoteRequiresApproval: boolean;
  quoteAutoConvertOnApproval: boolean;
  enablePerformanceUpdates: boolean;
  requireEngineeringReview: boolean;
  performanceUpdateCategories: string[];
};

const DEFAULT_SETTINGS: ManufacturingSettingsState = {
  defaultCycleTimeMinutes: 60,
  defaultSetupTimeMinutes: 30,
  defaultFirstArticleRequired: true,
  defaultQaSignoffRequired: false,
  trackScrapByDefault: true,
  trackReworkByDefault: true,
  scrapReasonRequired: true,
  reworkReasonRequired: true,
  requireSupervisorSignoff: false,
  requireIncomingConfirmation: true,
  handoffReminderMinutes: 15,
  enableDelayCodes: true,
  requireDelayCode: true,
  workOrderPrefix: "WO",
  partNumberFormat: "alphanumeric",
  autoGenerateWorkOrders: false,
  enableQuoteSystem: false,
  quoteNumberPrefix: "Q",
  quoteValidityDays: 30,
  quoteRequiresApproval: true,
  quoteAutoConvertOnApproval: false,
  enablePerformanceUpdates: true,
  requireEngineeringReview: false,
  performanceUpdateCategories: ["process_improvement", "safety", "quality", "tooling"],
};

export function ManufacturingSettings() {
  const { form, update, setForm, isDirty, isSaving, save, discard, loading } =
    useSettingsForm<ManufacturingSettingsState>({
      settingKey: "manufacturing_preferences",
      defaults: DEFAULT_SETTINGS,
      settingType: "manufacturing",
      successMessage: "Manufacturing settings have been updated.",
    });

  if (loading) return <SettingsSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cog className="w-5 h-5" />Production Defaults</CardTitle>
          <CardDescription>Default settings for new work orders and production runs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Cycle Time (minutes)</Label>
              <Input type="number" min={1} value={form.defaultCycleTimeMinutes} onChange={(e) => update("defaultCycleTimeMinutes", Math.max(1, parseInt(e.target.value, 10) || 60))} />
            </div>
            <div className="space-y-2">
              <Label>Default Setup Time (minutes)</Label>
              <Input type="number" min={1} value={form.defaultSetupTimeMinutes} onChange={(e) => update("defaultSetupTimeMinutes", Math.max(1, parseInt(e.target.value, 10) || 30))} />
            </div>
          </div>

          <SettingsSwitchRow
            label="First Article Inspection Required"
            description="Require first article before production"
            checked={form.defaultFirstArticleRequired}
            onCheckedChange={(v) => update("defaultFirstArticleRequired", v)}
          />
          <SettingsSwitchRow
            label="QA Sign-off Required"
            description="Require QA approval before completion"
            checked={form.defaultQaSignoffRequired}
            onCheckedChange={(v) => update("defaultQaSignoffRequired", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Quality Tracking</CardTitle>
          <CardDescription>Configure scrap and rework tracking settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SettingsSwitchRow label="Track Scrap" description="Enable scrap counting" checked={form.trackScrapByDefault} onCheckedChange={(v) => update("trackScrapByDefault", v)} bordered />
            <SettingsSwitchRow label="Track Rework" description="Enable rework counting" checked={form.trackReworkByDefault} onCheckedChange={(v) => update("trackReworkByDefault", v)} bordered />
          </div>
          <SettingsSwitchRow
            label="Require Scrap Reason"
            description="Operators must provide reason for scrap"
            checked={form.scrapReasonRequired}
            onCheckedChange={(v) => update("scrapReasonRequired", v)}
          />
          <SettingsSwitchRow
            label="Require Rework Reason"
            description="Operators must provide reason for rework"
            checked={form.reworkReasonRequired}
            onCheckedChange={(v) => update("reworkReasonRequired", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Factory className="w-5 h-5" />Handoff Settings</CardTitle>
          <CardDescription>Configure shift handoff requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingsSwitchRow
            label="Require Supervisor Sign-off"
            description="Supervisor must approve handoffs"
            checked={form.requireSupervisorSignoff}
            onCheckedChange={(v) => update("requireSupervisorSignoff", v)}
          />
          <SettingsSwitchRow
            label="Require Incoming Confirmation"
            description="Incoming operator must confirm handoff"
            checked={form.requireIncomingConfirmation}
            onCheckedChange={(v) => update("requireIncomingConfirmation", v)}
          />
          <div className="space-y-2">
            <Label>Handoff Reminder (minutes before shift end)</Label>
            <Input type="number" min={5} max={60} value={form.handoffReminderMinutes} onChange={(e) => update("handoffReminderMinutes", Math.min(60, Math.max(5, parseInt(e.target.value, 10) || 15)))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />Work Order Settings</CardTitle>
          <CardDescription>Configure work order numbering, format, and quoting workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Work Order Prefix</Label>
              <Input value={form.workOrderPrefix} onChange={(e) => update("workOrderPrefix", e.target.value)} placeholder="WO" maxLength={5} />
            </div>
            <div className="space-y-2">
              <Label>Part Number Format</Label>
              <Select value={form.partNumberFormat} onValueChange={(v) => update("partNumberFormat", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphanumeric">Alphanumeric (ABC-123)</SelectItem>
                  <SelectItem value="numeric">Numeric Only (123456)</SelectItem>
                  <SelectItem value="freeform">Free Form</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SettingsSwitchRow
            label="Enable Delay Codes"
            description="Track delays with standardized codes"
            checked={form.enableDelayCodes}
            onCheckedChange={(v) => update("enableDelayCodes", v)}
          />
          <SettingsSwitchRow
            label="Require Delay Code on Hold"
            description="Must select delay code when placing on hold"
            checked={form.requireDelayCode}
            onCheckedChange={(v) => update("requireDelayCode", v)}
          />
        </CardContent>
      </Card>

      <SettingsFooter
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={save}
        onDiscard={discard}
        label="Save Manufacturing Settings"
      />
    </div>
  );
}
