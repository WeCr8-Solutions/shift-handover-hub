import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Globe, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";

type GeneralPreferences = {
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  darkModeDefault: boolean;
  autoRefreshInterval: number;
  showCompletedItems: boolean;
  defaultView: string;
};

const DEFAULT_SETTINGS: GeneralPreferences = {
  timezone: "America/New_York",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  language: "en",
  darkModeDefault: false,
  autoRefreshInterval: 30,
  showCompletedItems: true,
  defaultView: "stations",
};

export function GeneralSettings() {
  const { toast } = useToast();
  const { getSetting, updateSetting, loading } = useAppSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<GeneralPreferences>(DEFAULT_SETTINGS);

  const generalSettings = useMemo(() => {
    return getSetting("general_preferences");
  }, [getSetting]);

  useEffect(() => {
    if (generalSettings && typeof generalSettings === "object") {
      setSettings((prev) => ({
        ...prev,
        ...generalSettings,
      }));
    }
  }, [generalSettings]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await updateSetting("general_preferences", settings, "general");

      if (error) {
        toast({
          title: "Failed to save settings",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="py-4 space-y-2"><Skeleton className="h-5 w-36" /><Skeleton className="h-4 w-56" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Regional Settings
          </CardTitle>
          <CardDescription>Configure timezone, date, and time formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={settings.timezone} onValueChange={(v) => setSettings((p) => ({ ...p, timezone: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Phoenix">Arizona (MST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={settings.dateFormat} onValueChange={(v) => setSettings((p) => ({ ...p, dateFormat: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select value={settings.timeFormat} onValueChange={(v) => setSettings((p) => ({ ...p, timeFormat: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={settings.language} onValueChange={(v) => setSettings((p) => ({ ...p, language: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Display Preferences
          </CardTitle>
          <CardDescription>Configure how the application looks and behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode by Default</Label>
              <p className="text-sm text-muted-foreground">Start the app in dark mode</p>
            </div>
            <Switch
              checked={settings.darkModeDefault}
              onCheckedChange={(v) => setSettings((p) => ({ ...p, darkModeDefault: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Completed Items</Label>
              <p className="text-sm text-muted-foreground">Display completed work orders in lists</p>
            </div>
            <Switch
              checked={settings.showCompletedItems}
              onCheckedChange={(v) => setSettings((p) => ({ ...p, showCompletedItems: v }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default View</Label>
              <Select
                value={settings.defaultView}
                onValueChange={(v) => setSettings((p) => ({ ...p, defaultView: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stations">Station Grid</SelectItem>
                  <SelectItem value="queue">Work Queue</SelectItem>
                  <SelectItem value="kanban">Kanban Board</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dashboard Auto-Refresh Interval (seconds)</Label>
              <p className="text-xs text-muted-foreground">
                Controls how often dashboards silently refresh data in the background. Lower values mean more up-to-date data but increased network usage. Applies to all users in this organization.
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={10}
                  max={600}
                  value={settings.autoRefreshInterval}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    const safeValue = Number.isFinite(raw) ? Math.min(600, Math.max(10, raw)) : 300;

                    setSettings((p) => ({
                      ...p,
                      autoRefreshInterval: safeValue,
                    }));
                  }}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">
                  ({Math.floor(settings.autoRefreshInterval / 60)}m {settings.autoRefreshInterval % 60}s)
                </span>
              </div>
            </div>
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
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
