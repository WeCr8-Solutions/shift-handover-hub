import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Bell, Mail, Smartphone, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";

export function NotificationSettings() {
  const { toast } = useToast();
  const { notifications, updateNotifications, loading } = useNotificationPrefs();
  const [isSaving, setIsSaving] = useState(false);

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
    const { error } = await updateNotifications({
      ...settings,
      quiet_hours_start: settings.quiet_hours_start || null,
      quiet_hours_end: settings.quiet_hours_end || null,
    });
    setIsSaving(false);

    if (error) {
      toast({ title: "Failed to save settings", description: error, variant: "destructive" });
    } else {
      setInitialSettings(settings);
      toast({ title: "Settings saved", description: "Notification preferences have been updated." });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="py-4 space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-48" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Choose which email notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Handoff Alerts</Label>
              <p className="text-sm text-muted-foreground">Notify when a handoff requires your attention</p>
            </div>
            <Switch checked={settings.email_handoff_alerts} onCheckedChange={(v) => setSettings(p => ({ ...p, email_handoff_alerts: v }))} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Quality Alerts</Label>
              <p className="text-sm text-muted-foreground">Notify about quality issues and holds</p>
            </div>
            <Switch checked={settings.email_quality_alerts} onCheckedChange={(v) => setSettings(p => ({ ...p, email_quality_alerts: v }))} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Machine Down Alerts</Label>
              <p className="text-sm text-muted-foreground">Notify when a machine goes down</p>
            </div>
            <Switch checked={settings.email_machine_down} onCheckedChange={(v) => setSettings(p => ({ ...p, email_machine_down: v }))} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Shift Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminders before your shift starts</p>
            </div>
            <Switch checked={settings.email_shift_reminders} onCheckedChange={(v) => setSettings(p => ({ ...p, email_shift_reminders: v }))} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">Receive a weekly production summary</p>
            </div>
            <Switch checked={settings.email_weekly_summary} onCheckedChange={(v) => setSettings(p => ({ ...p, email_weekly_summary: v }))} />
          </div>
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
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive real-time alerts on your device</p>
            </div>
            <Switch checked={settings.push_enabled} onCheckedChange={(v) => setSettings(p => ({ ...p, push_enabled: v }))} />
          </div>

          {settings.push_enabled && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div>
                <Label>Urgent Only</Label>
                <p className="text-sm text-muted-foreground">Only notify for critical alerts</p>
              </div>
              <Switch checked={settings.push_urgent_only} onCheckedChange={(v) => setSettings(p => ({ ...p, push_urgent_only: v }))} />
            </div>
          )}
        </CardContent>
      </Card>

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

      <div className="flex items-center justify-end gap-3">
        {isDirty && (
          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
            Unsaved changes
          </Badge>
        )}
        <Button onClick={handleSave} disabled={isSaving || !isDirty} className="gap-2">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isDirty ? "Save Notification Settings" : "Saved"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
