import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Smartphone, Moon, BellRing, ShieldOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { useDeviceNotifications } from "@/hooks/useDeviceNotifications";
import { SettingsSkeleton } from "./SettingsSkeleton";
import { SettingsFooter } from "./SettingsFooter";
import { SettingsSwitchRow } from "./SettingsSwitchRow";
import { SettingsErrorBanner } from "./SettingsErrorBanner";

export function NotificationSettings() {
  const { toast } = useToast();
  const { notifications, updateNotifications, loading } = useNotificationPrefs();
  const [isSaving, setIsSaving] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    email_handoff_alerts: true,
    email_quality_alerts: true,
    email_machine_down: true,
    email_shift_reminders: false,
    email_weekly_summary: true,
    push_enabled: false,
    push_urgent_only: true,
    quiet_hours_start: "",
    quiet_hours_end: "",
  });

  const [initialSettings, setInitialSettings] = useState(settings);

  useEffect(() => {
    if (notifications) {
      const loaded = {
        email_handoff_alerts: notifications.email_handoff_alerts,
        email_quality_alerts: notifications.email_quality_alerts,
        email_machine_down: notifications.email_machine_down,
        email_shift_reminders: notifications.email_shift_reminders,
        email_weekly_summary: notifications.email_weekly_summary,
        push_enabled: notifications.push_enabled,
        push_urgent_only: notifications.push_urgent_only,
        quiet_hours_start: notifications.quiet_hours_start || "",
        quiet_hours_end: notifications.quiet_hours_end || "",
      };
      setSettings(loaded);
      setInitialSettings(loaded);
    }
  }, [notifications]);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await updateNotifications({
        ...settings,
        quiet_hours_start: settings.quiet_hours_start || null,
        quiet_hours_end: settings.quiet_hours_end || null,
      });

      if (error) {
        setLastError(error);
        toast({ title: "Failed to save settings", description: error, variant: "destructive" });
      } else {
        setLastError(null);
        setInitialSettings(settings);
        toast({ title: "Settings saved", description: "Notification preferences have been updated." });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected error while saving";
      setLastError(msg);
      toast({ title: "Failed to save settings", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings(initialSettings);
    setLastError(null);
  };

  if (loading) return <SettingsSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      <SettingsErrorBanner
        error={lastError}
        onDismiss={() => setLastError(null)}
        context="Notification Settings"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Choose which email notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingsSwitchRow label="Handoff Alerts" description="Notify when a handoff requires your attention" checked={settings.email_handoff_alerts} onCheckedChange={(v) => setSettings(p => ({ ...p, email_handoff_alerts: v }))} bordered />
          <SettingsSwitchRow label="Quality Alerts" description="Notify about quality issues and holds" checked={settings.email_quality_alerts} onCheckedChange={(v) => setSettings(p => ({ ...p, email_quality_alerts: v }))} bordered />
          <SettingsSwitchRow label="Machine Down Alerts" description="Notify when a machine goes down" checked={settings.email_machine_down} onCheckedChange={(v) => setSettings(p => ({ ...p, email_machine_down: v }))} bordered />
          <SettingsSwitchRow label="Shift Reminders" description="Get reminders before your shift starts" checked={settings.email_shift_reminders} onCheckedChange={(v) => setSettings(p => ({ ...p, email_shift_reminders: v }))} bordered />
          <SettingsSwitchRow label="Weekly Summary" description="Receive a weekly production summary" checked={settings.email_weekly_summary} onCheckedChange={(v) => setSettings(p => ({ ...p, email_weekly_summary: v }))} bordered />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>Configure mobile and browser push notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingsSwitchRow label="Enable Push Notifications" description="Receive real-time alerts on your device" checked={settings.push_enabled} onCheckedChange={(v) => setSettings(p => ({ ...p, push_enabled: v }))} bordered />
          {settings.push_enabled && (
            <SettingsSwitchRow label="Urgent Only" description="Only notify for critical alerts" checked={settings.push_urgent_only} onCheckedChange={(v) => setSettings(p => ({ ...p, push_urgent_only: v }))} bordered className="bg-muted/30" />
          )}
        </CardContent>
      </Card>

      <DeviceAlertsCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>Set hours when you don't want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={settings.quiet_hours_start} onChange={(e) => setSettings(p => ({ ...p, quiet_hours_start: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={settings.quiet_hours_end} onChange={(e) => setSettings(p => ({ ...p, quiet_hours_end: e.target.value }))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Leave empty to disable quiet hours. During quiet hours, only urgent alerts will be sent.</p>
        </CardContent>
      </Card>

      <SettingsFooter
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onDiscard={handleDiscard}
        label="Save Notification Settings"
      />
    </div>
  );
}

function DeviceAlertsCard() {
  const { supported, permission, prefs, setPrefs, requestPermission } = useDeviceNotifications();
  const granted = permission === "granted";
  const denied = permission === "denied";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="w-5 h-5" />
          Device Alerts
        </CardTitle>
        <CardDescription>
          Foreground browser notifications when you receive a DM, recruiter outreach, or critical alert.
          {!supported && " Your browser does not support notifications."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {supported && !granted && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 p-3">
            <div className="flex items-start gap-2 min-w-0">
              {denied ? (
                <ShieldOff className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
              ) : (
                <BellRing className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {denied ? "Notifications blocked" : "Permission required"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {denied
                    ? "Re-enable notifications for this site in your browser settings."
                    : "Allow this site to show device notifications."}
                </p>
              </div>
            </div>
            {!denied && (
              <Button size="sm" onClick={() => requestPermission()}>
                Enable
              </Button>
            )}
          </div>
        )}

        <SettingsSwitchRow
          label="Enable device alerts"
          description="Master switch for all device notifications on this browser."
          checked={prefs.master}
          onCheckedChange={(v) => setPrefs({ master: v })}
          disabled={!granted}
          bordered
        />
        <SettingsSwitchRow
          label="Direct messages"
          description="New DMs from connected teammates in your organization."
          checked={prefs.org_dm}
          onCheckedChange={(v) => setPrefs({ org_dm: v })}
          disabled={!granted || !prefs.master}
          bordered
        />
        <SettingsSwitchRow
          label="Recruiter outreach"
          description="Employer contact requests on the Talent platform."
          checked={prefs.recruiter}
          onCheckedChange={(v) => setPrefs({ recruiter: v })}
          disabled={!granted || !prefs.master}
          bordered
        />
        <SettingsSwitchRow
          label="Critical smart alerts"
          description="Overdue work orders, NCR escalations, and bottlenecks."
          checked={prefs.smart_alert}
          onCheckedChange={(v) => setPrefs({ smart_alert: v })}
          disabled={!granted || !prefs.master}
          bordered
        />
        <SettingsSwitchRow
          label="System updates"
          description="Platform announcements and changelogs."
          checked={prefs.system_update}
          onCheckedChange={(v) => setPrefs({ system_update: v })}
          disabled={!granted || !prefs.master}
          bordered
        />
        <p className="text-xs text-muted-foreground">
          Preferences are stored per device. Notifications fire when the tab is open in the background;
          background push (when the tab is closed) can be added later as an upgrade.
        </p>
      </CardContent>
    </Card>
  );
}
